<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use App\Support\Auth\UserAccess;
use App\Traits\Auditable;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use Auditable, HasApiTokens, HasFactory, Notifiable;

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
        'job_title',
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
            'departments' => 'array',
            'is_active' => 'boolean',
            'role' => UserRole::class,
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (self $user): void {
            $user->departments = UserAccess::departmentsForRole($user->role);
        });
    }

    // --- Role Helpers ---
    // Final auth roles: encoder < paralegal < admin

    public const ROLE_HIERARCHY = [
        'encoder' => 1,
        'paralegal' => 2,
        'admin' => 3,
    ];

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function isParalegal(): bool
    {
        return $this->role === UserRole::Paralegal;
    }

    /**
     * Check if user is legal staff.
     */
    public function isLegalStaff(): bool
    {
        return in_array($this->role, [UserRole::Paralegal, UserRole::Admin], true);
    }

    public function hasRoleAtLeast(string|UserRole $minimumRole): bool
    {
        $min = self::normalizeRole($minimumRole);

        return $this->role instanceof UserRole && $this->role->isAtLeast($min);
    }

    public static function normalizeRole(string|UserRole $role): UserRole
    {
        if ($role instanceof UserRole) {
            return $role;
        }

        return UserRole::from(strtolower(trim($role)));
    }

    // --- Department Helpers ---

    /**
     * Get the user's departments as an array.
     */
    public function getDepartmentsArray(): array
    {
        return UserAccess::departmentsForRole($this->role);
    }

    /**
     * Check if user has access to a specific department.
     * Admin always has access to all departments.
     */
    public function hasDepartment(string $department): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        return in_array($department, $this->getDepartmentsArray());
    }

    /**
     * Check if user has access to the legal (law firm) module.
     */
    public function hasLegalAccess(): bool
    {
        return $this->hasDepartment('legal');
    }

    /**
     * Check if user has access to the brokerage module.
     */
    public function hasBrokerageAccess(): bool
    {
        return $this->hasDepartment('brokerage');
    }

    /**
     * Check if user has access to multiple departments (shows module switcher).
     */
    public function isMultiDepartment(): bool
    {
        return count($this->getDepartmentsArray()) > 1;
    }

    /**
     * @return array<string, bool>
     */
    public function getPermissionMap(): array
    {
        return UserAccess::permissionsFor($this->role, $this->getDepartmentsArray());
    }
}
