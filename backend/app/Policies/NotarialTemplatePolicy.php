<?php

namespace App\Policies;

use App\Models\NotarialTemplate;
use App\Models\User;

class NotarialTemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasLegalAccess();
    }

    public function view(User $user, NotarialTemplate $notarialTemplate): bool
    {
        return $user->hasLegalAccess();
    }

    public function create(User $user): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('paralegal');
    }

    public function update(User $user, NotarialTemplate $notarialTemplate): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('paralegal');
    }

    public function delete(User $user, NotarialTemplate $notarialTemplate): bool
    {
        return $user->isAdmin();
    }
}
