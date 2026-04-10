<?php

namespace App\Support\Auth;

use App\Enums\UserRole;

class UserAccess
{
    /**
     * @return list<string>
     */
    public static function departmentsForRole(UserRole|string|null $role): array
    {
        $normalizedRole = self::normalizeRole($role);

        return match ($normalizedRole) {
            UserRole::Admin => ['brokerage', 'legal'],
            UserRole::Paralegal => ['legal'],
            UserRole::Processor => ['brokerage'],
            UserRole::Accounting => ['brokerage'],
            UserRole::Encoder => ['brokerage'],
        };
    }

    /**
     * @return array<string, bool>
     */
    public static function permissionsFor(UserRole|string|null $role, ?array $departments = null): array
    {
        $normalizedRole = self::normalizeRole($role);
        $resolvedDepartments = $departments ?: self::departmentsForRole($normalizedRole);

        $canAccessBrokerage = in_array('brokerage', $resolvedDepartments, true) || $normalizedRole === UserRole::Admin;
        $canAccessLegal = in_array('legal', $resolvedDepartments, true) || $normalizedRole === UserRole::Admin;

        return [
            'access_brokerage_module' => $canAccessBrokerage,
            'access_legal_module' => $canAccessLegal,
            'manage_users' => $normalizedRole === UserRole::Admin,
            'manage_clients' => $normalizedRole === UserRole::Admin,
            'view_reports' => $normalizedRole === UserRole::Admin,
            'view_audit_logs' => $normalizedRole === UserRole::Admin,
            'manage_transaction_oversight' => $normalizedRole === UserRole::Admin,
            'upload_archives' => in_array($normalizedRole, [UserRole::Admin, UserRole::Encoder], true),
            'manage_notarial_books' => $normalizedRole === UserRole::Admin,
            'manage_notarial_entries' => in_array($normalizedRole, [UserRole::Admin, UserRole::Paralegal], true),
        ];
    }

    private static function normalizeRole(UserRole|string|null $role): UserRole
    {
        if ($role instanceof UserRole) {
            return $role;
        }

        return UserRole::from((string) ($role ?? UserRole::Encoder->value));
    }
}
