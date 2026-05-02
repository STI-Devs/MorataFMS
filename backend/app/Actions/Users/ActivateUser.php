<?php

namespace App\Actions\Users;

use App\Models\User;

class ActivateUser
{
    public function handle(User $user): User
    {
        $user->is_active = true;
        $user->save();

        return $user;
    }
}
