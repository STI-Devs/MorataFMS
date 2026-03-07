<?php

namespace App\Policies;

use App\Models\NotarialEntry;
use App\Models\User;

class NotarialEntryPolicy
{
    /**
     * Legal staff (paralegal+) or admin can view entries.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasLegalAccess();
    }

    /**
     * View a single entry.
     */
    public function view(User $user, NotarialEntry $entry): bool
    {
        return $user->hasLegalAccess();
    }

    /**
     * Paralegal+ with legal access can create entries.
     */
    public function create(User $user): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('paralegal');
    }

    /**
     * Only lawyer or admin can update entries.
     */
    public function update(User $user, NotarialEntry $entry): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('lawyer');
    }

    /**
     * Only admin can delete entries.
     */
    public function delete(User $user, NotarialEntry $entry): bool
    {
        return $user->isAdmin();
    }
}
