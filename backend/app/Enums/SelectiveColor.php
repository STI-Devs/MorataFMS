<?php

namespace App\Enums;

enum SelectiveColor: string
{
    case Green  = 'green';
    case Yellow = 'yellow';
    case Red    = 'red';

    public function label(): string
    {
        return ucfirst($this->value);
    }

    /** Returns a hex color for UI display. */
    public function hex(): string
    {
        return match($this) {
            self::Green  => '#30d158',
            self::Yellow => '#ffd60a',
            self::Red    => '#ff453a',
        };
    }
}
