<?php

namespace App\Policies;

use App\Models\AuditLog;
use App\Models\User;

class AuditLogPolicy
{
    /**
     * Only admin can view audit logs.
     * Audit logs are read-only — no create, update, or delete.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }
}
