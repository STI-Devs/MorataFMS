<?php

namespace App\Enums;

enum UserRole: string
{
    case Encoder = 'encoder';
    case Processor = 'processor';
    case Accounting = 'accounting';
    case Paralegal = 'paralegal';
    case Admin = 'admin';

    /** Returns true if this role is admin level. */
    public function isAdmin(): bool
    {
        return $this === self::Admin;
    }

    /** Returns true if this role is at least the given minimum role. */
    public function isAtLeast(self $minimum): bool
    {
        $hierarchy = [
            self::Encoder->value => 1,
            self::Processor->value => 2,
            self::Accounting->value => 2,
            self::Paralegal->value => 3,
            self::Admin->value => 4,
        ];

        return ($hierarchy[$this->value] ?? 0) >= ($hierarchy[$minimum->value] ?? 0);
    }

    public function label(): string
    {
        return match ($this) {
            self::Encoder => 'Encoder',
            self::Processor => 'Processor',
            self::Accounting => 'Accountant',
            self::Paralegal => 'Paralegal',
            self::Admin => 'Admin',
        };
    }
}
