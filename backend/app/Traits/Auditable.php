<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

/**
 * Auditable Trait
 *
 * Automatically logs create, update, and delete events on any model
 * that uses this trait. Captures who made the change, what changed
 * (old → new values), and the request IP address.
 *
 * Usage: Add `use Auditable;` to any Eloquent model.
 */
trait Auditable
{
    /**
     * Fields that should NEVER be logged (security).
     */
    protected static function getAuditExcludedFields(): array
    {
        return ['password', 'remember_token'];
    }

    /**
     * Boot the Auditable trait and register model event listeners.
     */
    public static function bootAuditable(): void
    {
        // Log when a model is created
        static::created(function ($model) {
            $model->logAudit('created', [], $model->getAuditableAttributes());
        });

        // Log when a model is updated (only changed fields)
        static::updated(function ($model) {
            $changes = $model->getChanges();
            $original = [];
            $new = [];

            foreach ($changes as $key => $value) {
                // Skip excluded fields and timestamps
                if (in_array($key, static::getAuditExcludedFields()) || $key === 'updated_at') {
                    continue;
                }

                $original[$key] = $model->getOriginal($key);
                $new[$key] = $value;
            }

            // Only log if there are actual tracked changes
            if (!empty($new)) {
                $model->logAudit('updated', $original, $new);
            }
        });

        // Log when a model is deleted
        static::deleted(function ($model) {
            $model->logAudit('deleted', $model->getAuditableAttributes(), []);
        });
    }

    /**
     * Get model attributes filtered to exclude sensitive fields.
     */
    protected function getAuditableAttributes(): array
    {
        $attributes = $this->getAttributes();

        foreach (static::getAuditExcludedFields() as $field) {
            unset($attributes[$field]);
        }

        // Remove timestamps from created event (not useful for audit)
        unset($attributes['created_at'], $attributes['updated_at']);

        return $attributes;
    }

    /**
     * Create the audit log entry.
     */
    protected function logAudit(string $event, array $oldValues, array $newValues): void
    {
        AuditLog::create([
            'auditable_type' => get_class($this),
            'auditable_id' => $this->getKey(),
            'user_id' => Auth::id(),
            'event' => $event,
            'old_values' => !empty($oldValues) ? $oldValues : null,
            'new_values' => !empty($newValues) ? $newValues : null,
            'ip_address' => Request::ip(),
        ]);
    }

    /**
     * Relationship to access audit logs from the model.
     */
    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }
}
