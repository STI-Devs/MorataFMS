<?php

namespace App\Policies;

use App\Models\Country;
use App\Models\User;

class CountryPolicy
{
    /**
     * All authenticated users can view the countries reference list.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Country $country): bool
    {
        return $user->isAdmin();
    }
}
