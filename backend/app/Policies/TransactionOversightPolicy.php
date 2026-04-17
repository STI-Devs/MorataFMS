<?php

namespace App\Policies;

use App\Models\User;

class TransactionOversightPolicy
{
    /**
     * Only admins can view the combined oversight dashboard.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Only admins can override a transaction's status.
     */
    public function overrideStatus(User $user): bool
    {
        return $user->isAdmin();
    }
}
