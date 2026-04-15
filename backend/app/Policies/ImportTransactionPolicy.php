<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\ImportTransaction;
use App\Models\User;

class ImportTransactionPolicy
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
        return in_array($user->role, [UserRole::Encoder, UserRole::Admin], true);
    }

    /**
     * Only the creator OR admin can update.
     */
    public function update(User $user, ImportTransaction $transaction): bool
    {
        return $user->isAdmin()
            || ($user->role === UserRole::Encoder && $user->id === $transaction->assigned_user_id);
    }

    /**
     * Only admin can delete.
     */
    public function delete(User $user, ImportTransaction $transaction): bool
    {
        return $user->isAdmin();
    }
}
