<?php

namespace App\Policies;

use App\Models\NotarialTemplateRecord;
use App\Models\User;

class NotarialTemplateRecordPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasLegalAccess();
    }

    public function view(User $user, NotarialTemplateRecord $notarialTemplateRecord): bool
    {
        return $user->hasLegalAccess();
    }

    public function create(User $user): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('paralegal');
    }

    public function delete(User $user, NotarialTemplateRecord $notarialTemplateRecord): bool
    {
        return $user->isAdmin();
    }
}
