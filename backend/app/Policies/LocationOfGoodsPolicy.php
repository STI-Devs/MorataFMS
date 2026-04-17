<?php

namespace App\Policies;

use App\Models\LocationOfGoods;
use App\Models\User;

class LocationOfGoodsPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, LocationOfGoods $locationOfGoods): bool
    {
        return $user->isAdmin();
    }
}
