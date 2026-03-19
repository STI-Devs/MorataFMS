<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
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
            'password'          => 'hashed',
            'departments'       => 'array',
            'is_active'         => 'boolean',
            'role'              => UserRole::class,
        ];
    }

    // --- Role Helpers ---
    // Role hierarchy: encoder < paralegal < lawyer < admin

    public const ROLE_HIERARCHY = [
        'encoder' => 1,
        'paralegal' => 2,
        'lawyer' => 3,
        'admin' => 4,
    ];

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    public function isLawyer(): bool
    {
        return $this->role === UserRole::Supervisor; // mapped: supervisor = lawyer role
    }

    public function isParalegal(): bool
    {
        return $this->role === UserRole::Broker; // mapped: broker = paralegal role
    }

    /**
     * Check if user is legal staff (paralegal or lawyer).
     */
    public function isLegalStaff(): bool
    {
        return in_array($this->role, [UserRole::Broker, UserRole::Supervisor]);
    }

    public function hasRoleAtLeast(string|UserRole $minimumRole): bool
    {
        $min = $minimumRole instanceof UserRole ? $minimumRole : UserRole::from($minimumRole);
        return $this->role instanceof UserRole && $this->role->isAtLeast($min);
    }

    // --- Department Helpers ---

    /**
     * Get the user's departments as an array.
     */
    public function getDepartmentsArray(): array
    {
        return $this->departments ?? ['brokerage'];
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
        if ($this->isAdmin()) {
            return true;
        }
        return count($this->getDepartmentsArray()) > 1;
    }
}
