<?php

namespace App\Enums;

enum SelectiveColor: string
{
    case Green = 'green';
    case Yellow = 'yellow';
    case Orange = 'orange';
    case Red = 'red';

    public function label(): string
    {
        return ucfirst($this->value);
    }

    /** Returns a hex color for UI display. */
    public function hex(): string
    {
        return match ($this) {
            self::Green => '#30d158',
            self::Yellow => '#ffd60a',
            self::Orange => '#ff9f0a',
            self::Red => '#ff453a',
        };
    }
}
