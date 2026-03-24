<?php

namespace App\Policies;

use App\Models\ExportTransaction;
use App\Models\User;

class ExportTransactionPolicy
{
    /**
     * Any authenticated user can view the list.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasBrokerageAccess();
    }

    /**
     * Any authenticated user can create transactions.
     */
    public function create(User $user): bool
    {
        return $user->hasBrokerageAccess();
    }

    /**
     * Only the creator OR admin can update.
     */
    public function update(User $user, ExportTransaction $transaction): bool
    {
        return $user->isAdmin()
            || ($user->hasBrokerageAccess() && $user->id === $transaction->assigned_user_id);
    }

    /**
     * Only admin can delete.
     */
    public function delete(User $user, ExportTransaction $transaction): bool
    {
        return $user->isAdmin();
    }
}
