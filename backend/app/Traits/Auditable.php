<?php

namespace App\Traits;

use App\Enums\AuditEvent;
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
     * When true, all audit logging is suppressed for this model class.
     * Use withoutAuditing() to temporarily disable during seeders/imports.
     */
    protected static bool $auditingDisabled = false;

    /**
     * Run a callback with auditing disabled, then restore previous state.
     * Usage: ImportTransaction::withoutAuditing(fn() => ImportTransaction::create([...]));
     */
    public static function withoutAuditing(callable $callback): mixed
    {
        static::$auditingDisabled = true;
        try {
            return $callback();
        } finally {
            static::$auditingDisabled = false;
        }
    }

    /**
     * Boot the Auditable trait and register model event listeners.
     */
    public static function bootAuditable(): void
    {
        // Log when a model is created
        static::created(function ($model) {
            $model->logAudit(AuditEvent::Created, [], $model->getAuditableAttributes());
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
                $model->logAudit(AuditEvent::Updated, $original, $new);
            }
        });

        // Log when a model is deleted
        static::deleted(function ($model) {
            $model->logAudit(AuditEvent::Deleted, $model->getAuditableAttributes(), []);
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
    protected function logAudit(AuditEvent|string $event, array $oldValues, array $newValues): void
    {
        if (static::$auditingDisabled) {
            return;
        }

        // Resolve to string value if enum was passed
        $eventValue = $event instanceof AuditEvent ? $event->value : $event;

        AuditLog::create([
            'auditable_type' => get_class($this),
            'auditable_id'   => $this->getKey(),
            'user_id'        => Auth::id(),
            'event'          => $eventValue,
            'old_values'     => !empty($oldValues) ? $oldValues : null,
            'new_values'     => !empty($newValues) ? $newValues : null,
            'ip_address'     => Request::ip(),
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
