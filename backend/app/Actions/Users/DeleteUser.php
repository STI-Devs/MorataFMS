<?php

namespace App\Actions\Users;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DeleteUser
{
    public function handle(User $user): void
    {
        if ($user->role === UserRole::Admin && $user->is_active) {
            $activeAdminCount = User::query()
                ->where('role', UserRole::Admin->value)
                ->where('is_active', true)
                ->count();

            if ($activeAdminCount <= 1) {
                throw new HttpException(422, 'Cannot delete the last active admin account. Assign another admin first.');
            }
        }

        $user->is_active = false;
        $user->save();
        $user->tokens()->delete();

        if (config('session.driver') === 'database') {
            DB::table((string) config('session.table', 'sessions'))
                ->where('user_id', $user->getKey())
                ->delete();
        }

        $user->delete();
    }
}
