<?php

namespace App\Http\Resources;

use App\Models\Client;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    protected static array $userCache = [];

    protected static array $clientCache = [];

    protected static array $documentCache = [];

    protected static array $transactionCache = [];

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'event' => $this->event,
            'auditable_type' => $this->humanizeType($this->auditable_type),
            'auditable_id' => $this->auditable_id,
            'auditable_label' => $this->resolveAuditableLabel(),
            'old_values' => $this->formatValues($this->old_values),
            'new_values' => $this->formatValues($this->new_values),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'role' => $this->user->role?->value ?? $this->user->role,
                ];
            }),
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    /**
     * Resolve a human-readable display name for the audited record.
     * Checks common name fields across all auditable model types.
     */
    private function resolveAuditableLabel(): ?string
    {
        $model = $this->whenLoaded('auditable', fn () => $this->auditable);

        if ($model) {
            // Priority: name (User, Client) → bl_number (Export) → entry_number (Import) → filename (Document)
            if ($label = $model->name ?? $model->bl_number ?? $model->entry_number ?? $model->filename) {
                return $label;
            }

            if ($model instanceof TransactionRemark) {
                return "Remark #{$model->id}";
            }

            return null;
        }

        // Model is gone (deleted) — derive label from the old_values snapshot instead
        $old = $this->old_values;
        if (is_array($old)) {
            return $old['name']
                ?? $old['filename']
                ?? $old['bl_number']
                ?? $old['entry_number']
                ?? null;
        }

        return null;
    }

    private function humanizeType(?string $type): ?string
    {
        if (! $type) {
            return null;
        }

        // Strip namespace: 'App\Models\ImportTransaction' → 'ImportTransaction'
        $basename = class_basename($type);

        // PascalCase → space-separated: 'ImportTransaction' → 'Import Transaction'
        return preg_replace('/(?<!^)([A-Z])/', ' $1', $basename);
    }

    /**
     * Format the changed values to be more readable.
     * Strips raw namespaces like "App\Models\ExportTransaction".
     */
    private function formatValues(?array $values): ?array
    {
        if (! $values) {
            return null;
        }

        $formatted = [];
        foreach ($values as $key => $value) {
            // Ignore the internal primary key ID, it's not a user-facing change
            if ($key === 'id') {
                continue;
            }

            // Strip raw namespaces if present in values
            if (is_string($value) && str_starts_with($value, 'App\\Models\\')) {
                $value = $this->humanizeType($value);
            }

            // Humanize specific foreign keys
            if (in_array($key, ['author_id', 'resolved_by', 'assigned_user_id', 'user_id', 'uploaded_by']) && $value) {
                $value = $this->resolveUserName($value);
            } elseif (in_array($key, ['importer_id', 'exporter_id', 'client_id']) && $value) {
                $value = $this->resolveClientName($value);
            } elseif ($key === 'document_id' && $value) {
                $value = $this->resolveDocumentName($value);
            } elseif ($key === 'documentable_id' && $value) {
                $type = $values['documentable_type'] ?? null;
                if (is_string($type) && str_starts_with($type, 'App\\Models\\')) {
                    $ref = $this->resolveTransactionRef($type, $value);
                    $typeName = $this->humanizeType($type);
                    // If no ref was resolved, show "Export Transaction #55" instead of bare "#55"
                    $value = ($ref === "#{$value}") ? "{$typeName} #{$value}" : $ref;
                } else {
                    $value = "#{$value}";
                }
            } elseif ($key === 'remarkble_id' && $value) {
                // Read from the ORIGINAL unformatted array, or the auditable model relation
                $type = $values['remarkble_type'] ?? ($this->auditable ? clone $this->auditable->remarkble_type : null);

                // If this is an UPDATE event (e.g. resolving a remark), remarkble_type might not be in the changes array.
                // If the auditable relation is also empty, we must query the database to find what this remark is attached to.
                if (! $type && $this->auditable_type === TransactionRemark::class) {
                    $remark = TransactionRemark::find($this->auditable_id);
                    if ($remark) {
                        $type = $remark->remarkble_type;
                    }
                }

                if (is_string($type) && str_starts_with($type, 'App\\Models\\')) {
                    // We format this using the raw type before it gets humanized
                    $value = $this->resolveTransactionRef($type, $value);
                } else {
                    $value = "#{$value}";
                }
            } elseif ($key === 'transaction_id' && $value) {
                $value = "#{$value}";
            }

            $formatted[$key] = $value;
        }

        return $formatted;
    }

    private function resolveUserName($id)
    {
        if (! isset(self::$userCache[$id])) {
            $user = User::find($id);
            self::$userCache[$id] = $user ? $user->name : "User #{$id}";
        }

        return self::$userCache[$id];
    }

    private function resolveClientName($id)
    {
        if (! isset(self::$clientCache[$id])) {
            $client = Client::find($id);
            self::$clientCache[$id] = $client ? $client->name : "Client #{$id}";
        }

        return self::$clientCache[$id];
    }

    private function resolveDocumentName($id)
    {
        if (! isset(self::$documentCache[$id])) {
            $doc = Document::find($id);
            self::$documentCache[$id] = $doc ? $doc->filename : "Document #{$id}";
        }

        return self::$documentCache[$id];
    }

    private function resolveTransactionRef($type, $id)
    {
        $cacheKey = "{$type}_{$id}";
        if (! isset(self::$transactionCache[$cacheKey])) {
            $model = $type::find($id);
            if ($model instanceof ImportTransaction) {
                $ref = $model->customs_ref_no;
            } elseif ($model instanceof ExportTransaction) {
                $ref = $model->bl_no;
            } else {
                $ref = $model->name ?? $model->customs_ref_no ?? $model->bl_no ?? $model->original_filename ?? "#{$id}";
            }
            self::$transactionCache[$cacheKey] = $ref ?: "#{$id}";
        }

        return self::$transactionCache[$cacheKey];
    }
}
