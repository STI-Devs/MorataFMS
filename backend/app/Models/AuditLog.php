<?php

namespace App\Models;

use App\Enums\AuditEvent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AuditLog extends Model
{
    const UPDATED_AT = null;

    protected $fillable = [
        'auditable_type',
        'auditable_id',
        'user_id',
        'event',
        'old_values',
        'new_values',
        'ip_address',
    ];

    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getModelNameAttribute(): string
    {
        return str($this->auditable_type)
            ->afterLast('\\')
            ->snake()
            ->replace('_', ' ')
            ->title()
            ->value();
    }

    /**
     * Static helper to record an audit log entry.
     * Bridges the action/description-style with the main Spatie-style schema.
     */
    public static function record(
        AuditEvent|string $event,
        string $description,
        ?int $userId = null,
        ?string $subjectType = null,
        ?int $subjectId = null,
        ?string $ipAddress = null
    ): self {
        $eventValue = $event instanceof AuditEvent ? $event->value : $event;

        return static::create([
            'user_id' => $userId,
            'event' => $eventValue,
            'auditable_type' => $subjectType
                ? 'App\\Models\\'.ucfirst($subjectType).'Transaction'
                : null,
            'auditable_id' => $subjectId,
            'new_values' => ['description' => $description],
            'ip_address' => $ipAddress,
        ]);
    }

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
        ];
    }
}
