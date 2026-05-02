<?php

namespace App\Actions\Users;

use App\Enums\UserRole;
use App\Models\User;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DeactivateUser
{
    public function handle(User $user): User
    {
        if ($user->role === UserRole::Admin) {
            $activeAdminCount = User::query()
                ->where('role', UserRole::Admin->value)
                ->where('is_active', true)
                ->count();

            if ($activeAdminCount <= 1) {
                throw new HttpException(422, 'Cannot deactivate the last active admin account. Assign another admin first.');
            }
        }

        $user->is_active = false;
        $user->save();

        return $user;
    }
}
