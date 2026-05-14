<?php

namespace App\Actions\Users;

use App\Models\User;
use InvalidArgumentException;

class RestoreUser
{
    public function handle(User $user, bool $activate = false): User
    {
        if (! $user->trashed()) {
            throw new InvalidArgumentException('Only soft-deleted users can be restored.');
        }

        $user->restore();

        if ($activate) {
            $user->is_active = true;
            $user->save();
        }

        return $user->refresh();
    }
}
