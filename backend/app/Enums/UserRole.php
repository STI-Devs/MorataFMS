<?php

namespace App\Enums;

enum UserRole: string
{
    case Encoder = 'encoder';
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
            self::Paralegal->value => 2,
            self::Admin->value => 3,
        ];

        return ($hierarchy[$this->value] ?? 0) >= ($hierarchy[$minimum->value] ?? 0);
    }

    public function label(): string
    {
        return match ($this) {
            self::Encoder => 'Encoder',
            self::Paralegal => 'Paralegal',
            self::Admin => 'Admin',
        };
    }
}
