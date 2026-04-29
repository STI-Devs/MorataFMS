<?php

namespace App\Policies;

use App\Models\NotarialLegacyFile;
use App\Models\User;

class NotarialLegacyFilePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasLegalAccess();
    }

    public function view(User $user, NotarialLegacyFile $notarialLegacyFile): bool
    {
        return $user->hasLegalAccess();
    }

    public function create(User $user): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('paralegal');
    }

    public function update(User $user, NotarialLegacyFile $notarialLegacyFile): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('paralegal');
    }

    public function delete(User $user, NotarialLegacyFile $notarialLegacyFile): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('paralegal');
    }
}
