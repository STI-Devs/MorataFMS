<?php

namespace App\Policies;

use App\Models\NotarialGeneratedDocument;
use App\Models\User;

class NotarialGeneratedDocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasLegalAccess();
    }

    public function view(User $user, NotarialGeneratedDocument $notarialGeneratedDocument): bool
    {
        return $user->hasLegalAccess();
    }

    public function create(User $user): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('paralegal');
    }

    public function delete(User $user, NotarialGeneratedDocument $notarialGeneratedDocument): bool
    {
        return $user->isAdmin();
    }
}
