<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;

class ClientPolicy
{
    /**
     * Any authenticated user can view clients.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Only admin can create clients.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Only admin can update clients.
     */
    public function update(User $user, Client $client): bool
    {
        return $user->isAdmin();
    }

    /**
     * Only admin can delete clients.
     */
    public function delete(User $user, Client $client): bool
    {
        return $user->isAdmin();
    }

    public function viewTransactions(User $user, Client $client): bool
    {
        return $user->isAdmin();
    }
}
