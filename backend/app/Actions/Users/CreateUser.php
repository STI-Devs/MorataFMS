<?php

namespace App\Actions\Users;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CreateUser
{
    public function handle(array $validated): User
    {
        $user = new User([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'job_title' => $validated['job_title'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);
        $user->role = UserRole::from($validated['role']);
        $user->save();

        return $user;
    }
}
