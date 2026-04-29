<?php

namespace App\Policies;

use App\Models\NotarialPageScan;
use App\Models\User;

class NotarialPageScanPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasLegalAccess();
    }

    public function view(User $user, NotarialPageScan $notarialPageScan): bool
    {
        return $user->hasLegalAccess();
    }

    public function create(User $user): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('paralegal');
    }

    public function update(User $user, NotarialPageScan $notarialPageScan): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('paralegal');
    }

    public function delete(User $user, NotarialPageScan $notarialPageScan): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('paralegal');
    }
}
