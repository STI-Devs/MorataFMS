<?php

namespace App\Models;

use App\Enums\ArchiveOrigin;
use App\Enums\ImportStatus;
use App\Enums\SelectiveColor;
use App\Enums\StageStatus;
use App\Enums\UserRole;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Carbon;

class ImportTransaction extends Model
{
    use Auditable, HasFactory;

    /**
     * @return array<string, string>
     */
    public static function documentStageMap(): array
    {
        return [
            'boc' => 'boc',
            'bonds' => 'bonds',
            'ppa' => 'ppa',
            'do' => 'do',
            'port_charges' => 'port_charges',
            'releasing' => 'releasing',
            'billing' => 'billing',
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function optionalStageFlagMap(): array
    {
        return [
            'bonds' => 'bonds_not_applicable',
        ];
    }

    /**
     * @return list<string>
     */
    public static function optionalStageKeys(): array
    {
        return array_keys(self::optionalStageFlagMap());
    }

    /**
     * @return list<string>
     */
    public static function processorOperationalDocumentTypes(): array
    {
        return ['ppa', 'port_charges'];
    }

    /**
     * @return list<string>
     */
    public static function accountingOperationalDocumentTypes(): array
    {
        return ['billing'];
    }

    protected $fillable = [
        'customs_ref_no',
        'bl_no',
        'selective_color',
        'importer_id',
        'origin_country_id',
        'arrival_date',
        'notes',
    ];

    protected $casts = [
        'arrival_date' => 'date',
        'is_archive' => 'boolean',
        'archived_at' => 'datetime',
        'archive_origin' => ArchiveOrigin::class,
        'status' => ImportStatus::class,
        'selective_color' => SelectiveColor::class,
    ];

    // Relationships
    public function importer(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'importer_id');
    }

    public function originCountry(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'origin_country_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function archivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    public function stages(): HasOne
    {
        return $this->hasOne(ImportStage::class);
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function remarks(): MorphMany
    {
        return $this->morphMany(TransactionRemark::class, 'remarkble');
    }

    protected static function booted(): void
    {
        static::created(function (ImportTransaction $transaction) {
            $transaction->stages()->create();
        });
    }

    /**
     * Recalculate stage and transaction statuses based on uploaded documents.
     * Called automatically by DocumentController after every upload or delete.
     */
    public function recalculateStatus(): void
    {
        $stageMap = self::documentStageMap();
        $optionalStageFlags = self::optionalStageFlagMap();
        $docTypes = $this->documents()->pluck('type')->toArray();
        $stages = $this->stages;

        if ($stages) {
            $stageUpdates = [];

            foreach ($stageMap as $docType => $stageKey) {
                $hasDoc = in_array($docType, $docTypes, true);
                $notApplicable = isset($optionalStageFlags[$docType])
                    ? (bool) $stages->{$optionalStageFlags[$docType]}
                    : false;
                $completedAtField = "{$stageKey}_completed_at";
                $completedByField = "{$stageKey}_completed_by";
                $stageUpdates["{$stageKey}_status"] = $hasDoc || $notApplicable
                    ? StageStatus::Completed->value
                    : StageStatus::Pending->value;
                $stageUpdates[$completedAtField] = $hasDoc || $notApplicable
                    ? ($stages->$completedAtField ?? now())
                    : null;
                $stageUpdates[$completedByField] = $hasDoc || $notApplicable
                    ? $stages->$completedByField
                    : null;
            }

            $stages->update($stageUpdates);
        }

        if ($this->is_archive) {
            $newStatus = ImportStatus::Completed;
        } elseif (in_array('billing', $docTypes, true)) {
            $newStatus = ImportStatus::Completed;
        } elseif (collect(['bonds', 'ppa', 'do', 'port_charges', 'releasing'])
            ->contains(fn (string $stage): bool => in_array($stage, $docTypes, true))) {
            $newStatus = ImportStatus::Processing;
        } elseif (in_array('boc', $docTypes, true)) {
            $newStatus = ImportStatus::VesselArrived;
        } else {
            $newStatus = ImportStatus::Pending;
        }

        if ($this->status !== $newStatus) {
            $this->status = $newStatus;
            $this->saveQuietly();
        }
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', ImportStatus::Pending->value);
    }

    public function scopeInProgress($query)
    {
        return $query->whereIn('status', [
            ImportStatus::VesselArrived->value,
            ImportStatus::Processing->value,
        ]);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', ImportStatus::Completed->value);
    }

    public function scopeVisibleTo($query, User $user)
    {
        if ($user->isAdmin()) {
            return $query;
        }

        return $query->where('assigned_user_id', $user->id);
    }

    public function scopeRelevantToOperationalQueue(Builder $query, User $user): Builder
    {
        return match ($user->role) {
            UserRole::Processor => $query
                ->where('is_archive', false)
                ->whereNotIn('status', [ImportStatus::Completed->value, ImportStatus::Cancelled->value])
                ->whereHas('stages', function (Builder $stageQuery): void {
                    $stageQuery->where(function (Builder $queueQuery): void {
                        $queueQuery
                            ->where(function (Builder $ppaQuery): void {
                                $ppaQuery
                                    ->where('ppa_status', '!=', StageStatus::Completed->value)
                                    ->where('boc_status', StageStatus::Completed->value)
                                    ->where('bonds_status', StageStatus::Completed->value);
                            })
                            ->orWhere(function (Builder $portChargesQuery): void {
                                $portChargesQuery
                                    ->where('port_charges_status', '!=', StageStatus::Completed->value)
                                    ->where('boc_status', StageStatus::Completed->value)
                                    ->where('bonds_status', StageStatus::Completed->value)
                                    ->where('ppa_status', StageStatus::Completed->value)
                                    ->where('do_status', StageStatus::Completed->value);
                            });
                    });
                }),
            UserRole::Accounting => $query
                ->where('is_archive', false)
                ->whereNotIn('status', [ImportStatus::Completed->value, ImportStatus::Cancelled->value])
                ->whereHas('stages', function (Builder $stageQuery): void {
                    $stageQuery
                        ->where('billing_status', '!=', StageStatus::Completed->value)
                        ->where('boc_status', StageStatus::Completed->value)
                        ->where('bonds_status', StageStatus::Completed->value)
                        ->where('ppa_status', StageStatus::Completed->value)
                        ->where('do_status', StageStatus::Completed->value)
                        ->where('port_charges_status', StageStatus::Completed->value)
                        ->where('releasing_status', StageStatus::Completed->value);
                }),
            default => $query,
        };
    }

    public function scopeRelevantToOperationalWorkspace(Builder $query, User $user): Builder
    {
        return match ($user->role) {
            UserRole::Processor => $query
                ->where('is_archive', false)
                ->whereNotIn('status', [ImportStatus::Completed->value, ImportStatus::Cancelled->value])
                ->whereHas('stages', function (Builder $stageQuery): void {
                    $stageQuery->where(function (Builder $queueQuery): void {
                        $queueQuery
                            ->where('ppa_status', '!=', StageStatus::Completed->value)
                            ->orWhere('port_charges_status', '!=', StageStatus::Completed->value);
                    });
                }),
            UserRole::Accounting => $query
                ->where('is_archive', false)
                ->whereNotIn('status', [ImportStatus::Completed->value, ImportStatus::Cancelled->value])
                ->whereHas('stages', function (Builder $stageQuery): void {
                    $stageQuery->where('billing_status', '!=', StageStatus::Completed->value);
                }),
            default => $query,
        };
    }

    /**
     * @return list<string>
     */
    public function operationalDocumentTypesFor(User $user): array
    {
        $documentTypes = match ($user->role) {
            UserRole::Processor => self::processorOperationalDocumentTypes(),
            UserRole::Accounting => self::accountingOperationalDocumentTypes(),
            default => [],
        };

        return array_values(array_filter(
            $documentTypes,
            fn (string $documentType): bool => $this->isOperationalDocumentTypeActionable($documentType),
        ));
    }

    public function isRelevantToOperationalQueue(User $user): bool
    {
        return $this->operationalDocumentTypesFor($user) !== [];
    }

    public function waitingSinceForOperationalRole(User $user): ?Carbon
    {
        $this->loadMissing('stages');

        if (! $this->stages || $this->status->isTerminal() || $this->is_archive) {
            return null;
        }

        $currentDocumentType = $this->currentOperationalDocumentTypeFor($user);

        if ($currentDocumentType === null) {
            return null;
        }

        $bottleneckDocumentType = $this->bottleneckDocumentTypeFor($currentDocumentType);

        return $this->waitingSinceForDocumentType($bottleneckDocumentType);
    }

    public function syncStageCompletionForDocument(string $documentType, int $userId): void
    {
        $stageKey = self::documentStageMap()[$documentType] ?? null;

        if ($stageKey === null) {
            return;
        }

        $stages = $this->stages()->firstOrCreate();

        $stages->update([
            "{$stageKey}_status" => StageStatus::Completed->value,
            "{$stageKey}_completed_at" => $stages->{"{$stageKey}_completed_at"} ?? now(),
            "{$stageKey}_completed_by" => $userId,
        ]);

        $this->unsetRelation('stages');
    }

    // Helper to get current stage progress
    public function getProgressAttribute(): array
    {
        $stages = $this->stages;
        if (! $stages) {
            return [];
        }

        return collect(self::documentStageMap())
            ->mapWithKeys(fn (string $stageKey, string $documentType) => [
                $documentType => $stages->{"{$stageKey}_status"},
            ])
            ->all();
    }

    /**
     * @return list<string>
     */
    public function notApplicableStageKeys(): array
    {
        $stages = $this->stages;

        if (! $stages) {
            return [];
        }

        return collect(self::optionalStageFlagMap())
            ->filter(fn (string $flagField) => (bool) $stages->{$flagField})
            ->keys()
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    public function requiredDocumentTypeKeys(): array
    {
        return Document::requiredTypeKeysFor(self::class, $this->notApplicableStageKeys());
    }

    public function isStageNotApplicable(string $stage): bool
    {
        $flagField = self::optionalStageFlagMap()[$stage] ?? null;

        if ($flagField === null || ! $this->stages) {
            return false;
        }

        return (bool) $this->stages->{$flagField};
    }

    public function setStageApplicability(string $stage, bool $notApplicable, int $userId): void
    {
        $flagField = self::optionalStageFlagMap()[$stage] ?? null;
        $stageKey = self::documentStageMap()[$stage] ?? null;

        if ($flagField === null || $stageKey === null) {
            return;
        }

        $stages = $this->stages()->firstOrCreate();
        $hasStageDocument = $this->documents()->where('type', $stage)->exists();

        $updates = [
            $flagField => $notApplicable,
        ];

        if ($notApplicable) {
            $updates["{$stageKey}_status"] = StageStatus::Completed->value;
            $updates["{$stageKey}_completed_at"] = $stages->{"{$stageKey}_completed_at"} ?? now();
            $updates["{$stageKey}_completed_by"] = $userId;
        } elseif (! $hasStageDocument) {
            $updates["{$stageKey}_status"] = StageStatus::Pending->value;
            $updates["{$stageKey}_completed_at"] = null;
            $updates["{$stageKey}_completed_by"] = null;
        }

        $stages->update($updates);
        $this->unsetRelation('stages');
    }

    public function isDocumentTypeReadyForUpload(string $documentType): bool
    {
        $this->loadMissing('stages');

        if (! $this->stages) {
            return false;
        }

        $stageKey = self::documentStageMap()[$documentType] ?? null;

        if ($stageKey === null) {
            return false;
        }

        if ($this->status->isTerminal() || $this->is_archive) {
            return true;
        }

        foreach ($this->precedingDocumentTypesFor($documentType) as $requiredDocumentType) {
            $requiredStageKey = self::documentStageMap()[$requiredDocumentType] ?? null;

            if ($requiredStageKey === null) {
                continue;
            }

            if ($this->stages->{"{$requiredStageKey}_status"} !== StageStatus::Completed) {
                return false;
            }
        }

        return true;
    }

    private function isOperationalDocumentTypeActionable(string $documentType): bool
    {
        $stageKey = self::documentStageMap()[$documentType] ?? null;

        if (! $this->isDocumentTypeReadyForUpload($documentType) || $stageKey === null || ! $this->stages) {
            return false;
        }

        if ($this->stages->{"{$stageKey}_status"} === StageStatus::Completed) {
            return false;
        }

        return true;
    }

    private function currentOperationalDocumentTypeFor(User $user): ?string
    {
        if (! $this->stages) {
            return null;
        }

        foreach ($this->operationalDocumentTypesForRole($user) as $documentType) {
            $stageKey = self::documentStageMap()[$documentType] ?? null;

            if ($stageKey === null) {
                continue;
            }

            if ($this->stages->{"{$stageKey}_status"} !== StageStatus::Completed) {
                return $documentType;
            }
        }

        return null;
    }

    /**
     * @return list<string>
     */
    private function operationalDocumentTypesForRole(User $user): array
    {
        return match ($user->role) {
            UserRole::Processor => self::processorOperationalDocumentTypes(),
            UserRole::Accounting => self::accountingOperationalDocumentTypes(),
            default => [],
        };
    }

    private function bottleneckDocumentTypeFor(string $documentType): string
    {
        if (! $this->stages) {
            return $documentType;
        }

        foreach ($this->precedingDocumentTypesFor($documentType) as $prerequisiteDocumentType) {
            $stageKey = self::documentStageMap()[$prerequisiteDocumentType] ?? null;

            if ($stageKey === null) {
                continue;
            }

            if ($this->stages->{"{$stageKey}_status"} !== StageStatus::Completed) {
                return $prerequisiteDocumentType;
            }
        }

        return $documentType;
    }

    private function waitingSinceForDocumentType(string $documentType): ?Carbon
    {
        if (! $this->stages) {
            return $this->created_at;
        }

        $latestPrerequisiteCompletion = collect($this->precedingDocumentTypesFor($documentType))
            ->map(fn (string $prerequisiteDocumentType): ?string => self::documentStageMap()[$prerequisiteDocumentType] ?? null)
            ->filter()
            ->map(fn (string $stageKey): ?Carbon => $this->stages->{"{$stageKey}_completed_at"})
            ->filter()
            ->sortBy(fn (Carbon $timestamp): int => $timestamp->getTimestamp())
            ->last();

        return $latestPrerequisiteCompletion ?? $this->created_at;
    }

    /**
     * @return list<string>
     */
    private function precedingDocumentTypesFor(string $documentType): array
    {
        $sequence = array_keys(self::documentStageMap());
        $index = array_search($documentType, $sequence, true);

        if ($index === false) {
            return [];
        }

        return array_slice($sequence, 0, $index);
    }
}
