<?php

namespace App\Enums;

enum RemarkSeverity: string
{
    case Info     = 'info';
    case Warning  = 'warning';
    case Critical = 'critical';

    public function label(): string
    {
        return ucfirst($this->value);
    }

    /** Returns a CSS color token for UI display. */
    public function color(): string
    {
        return match($this) {
            self::Info     => '#0a84ff',
            self::Warning  => '#ff9f0a',
            self::Critical => '#ff453a',
        };
    }
}
