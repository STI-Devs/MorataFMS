<?php

namespace App\Policies;

use App\Models\LegalArchiveRecord;
use App\Models\User;

class LegalArchiveRecordPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasLegalAccess();
    }

    public function view(User $user, LegalArchiveRecord $legalArchiveRecord): bool
    {
        return $user->hasLegalAccess();
    }

    public function create(User $user): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('paralegal');
    }

    public function update(User $user, LegalArchiveRecord $legalArchiveRecord): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('paralegal');
    }

    public function delete(User $user, LegalArchiveRecord $legalArchiveRecord): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('paralegal');
    }
}
