<?php

namespace App\Policies;

use App\Models\LegalParty;
use App\Models\User;

class LegalPartyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasLegalAccess();
    }

    public function view(User $user, LegalParty $legalParty): bool
    {
        return $user->hasLegalAccess();
    }
}
