<?php

namespace App\Policies;

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
}
