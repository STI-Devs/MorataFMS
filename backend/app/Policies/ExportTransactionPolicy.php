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
        return true;
    }

    /**
     * Any authenticated user can create transactions.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Only the creator OR admin can update.
     */
    public function update(User $user, ExportTransaction $transaction): bool
    {
        return $user->id === $transaction->assigned_user_id
            || $user->isAdmin();
    }

    /**
     * Only admin can delete.
     */
    public function delete(User $user, ExportTransaction $transaction): bool
    {
        return $user->isAdmin();
    }
}
