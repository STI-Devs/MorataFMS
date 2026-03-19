<?php

namespace App\Enums;

enum AuditEvent: string
{
    case Created = 'created';
    case Updated = 'updated';
    case Deleted = 'deleted';

    public function label(): string
    {
        return ucfirst($this->value);
    }

    public function icon(): string
    {
        return match($this) {
            self::Created => '➕',
            self::Updated => '✏️',
            self::Deleted => '🗑️',
        };
    }
}
