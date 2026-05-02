<?php

namespace App\Actions\Users;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UpdateUser
{
    public function handle(User $user, array $validated): User
    {
        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }

        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }

        if (array_key_exists('job_title', $validated)) {
            $user->job_title = $validated['job_title'];
        }

        if (isset($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        if (isset($validated['role'])) {
            $user->role = UserRole::from($validated['role']);
        }

        $user->save();

        return $user;
    }
}
