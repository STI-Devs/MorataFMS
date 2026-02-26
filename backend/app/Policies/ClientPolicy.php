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
     * Any authenticated user can create a basic client record.
     * Encoders need this to register new clients on-the-fly during archive uploads.
     * Full client details can be enriched by managers later.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Only supervisor+ can update clients.
     */
    public function update(User $user, Client $client): bool
    {
        return $user->isSupervisorOrAbove();
    }

    /**
     * Only admin can delete clients.
     */
    public function delete(User $user, Client $client): bool
    {
        return $user->isAdmin();
    }
}
