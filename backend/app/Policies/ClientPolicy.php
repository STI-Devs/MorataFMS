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
     * Brokerage staff can create a basic client record.
     * Encoders need this to register new clients on-the-fly during archive uploads.
     * Full client details can be enriched by admins later. Legal-only roles
     * (e.g. paralegal) are not allowed to write into the brokerage domain.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->hasBrokerageAccess();
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
}
