<?php

namespace App\Queries\Users;

use App\Models\User;
use Illuminate\Support\Collection;

class UserIndexQuery
{
    public function handle(): Collection
    {
        return User::query()
            ->orderBy('name')
            ->get();
    }
}
