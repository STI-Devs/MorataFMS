<?php

namespace App\Enums;

enum AuditEvent: string
{
    case Created = 'created';
    case Updated = 'updated';
    case Deleted = 'deleted';
    case EncoderReassigned = 'encoder_reassigned';
    case StatusChanged = 'status_changed';

    public function label(): string
    {
        return ucfirst($this->value);
    }

    public function icon(): string
    {
        return match ($this) {
            self::Created => '➕',
            self::Updated => '✏️',
            self::Deleted => '🗑️',
            self::EncoderReassigned => '↔️',
            self::StatusChanged => '🔁',
        };
    }
}
