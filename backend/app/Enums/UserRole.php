<?php

namespace App\Enums;

enum UserRole: string
{
    case Encoder    = 'encoder';
    case Broker     = 'broker';
    case Supervisor = 'supervisor';
    case Manager    = 'manager';
    case Admin      = 'admin';

    /** Returns true if this role is admin level. */
    public function isAdmin(): bool
    {
        return $this === self::Admin;
    }

    /** Returns true if this role is at least the given minimum role. */
    public function isAtLeast(self $minimum): bool
    {
        $hierarchy = [
            self::Encoder->value    => 1,
            self::Broker->value     => 2,
            self::Supervisor->value => 3,
            self::Manager->value    => 4,
            self::Admin->value      => 5,
        ];

        return ($hierarchy[$this->value] ?? 0) >= ($hierarchy[$minimum->value] ?? 0);
    }

    public function label(): string
    {
        return match($this) {
            self::Encoder    => 'Encoder',
            self::Broker     => 'Broker',
            self::Supervisor => 'Supervisor',
            self::Manager    => 'Manager',
            self::Admin      => 'Admin',
        };
    }
}
