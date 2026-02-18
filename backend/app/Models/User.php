<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, Auditable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    /**
     * The attributes that are mass assignable.
     * NOTE: 'role' is intentionally excluded to prevent privilege escalation.
     * Use $user->role = 'admin'; $user->save(); for admin-only role changes.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // --- Role Helpers ---
    // Role hierarchy: encoder < broker < supervisor < manager < admin

    private const ROLE_HIERARCHY = [
        'encoder' => 1,
        'broker' => 2,
        'supervisor' => 3,
        'manager' => 4,
        'admin' => 5,
    ];

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isManagerOrAbove(): bool
    {
        return (self::ROLE_HIERARCHY[$this->role] ?? 0) >= self::ROLE_HIERARCHY['manager'];
    }

    public function isSupervisorOrAbove(): bool
    {
        return (self::ROLE_HIERARCHY[$this->role] ?? 0) >= self::ROLE_HIERARCHY['supervisor'];
    }

    public function hasRoleAtLeast(string $minimumRole): bool
    {
        return (self::ROLE_HIERARCHY[$this->role] ?? 0) >= (self::ROLE_HIERARCHY[$minimumRole] ?? 99);
    }
}
