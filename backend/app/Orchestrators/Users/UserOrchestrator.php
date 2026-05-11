<?php

namespace App\Orchestrators\Users;

use App\Actions\Users\ActivateUser;
use App\Actions\Users\CreateUser;
use App\Actions\Users\DeactivateUser;
use App\Actions\Users\DeleteUser;
use App\Actions\Users\UpdateUser;
use App\Models\User;
use App\Queries\Users\UserIndexQuery;
use Illuminate\Support\Collection;

class UserOrchestrator
{
    public function __construct(
        private UserIndexQuery $userIndexQuery,
        private CreateUser $createUser,
        private UpdateUser $updateUser,
        private DeleteUser $deleteUser,
        private DeactivateUser $deactivateUser,
        private ActivateUser $activateUser,
    ) {}

    /**
     * @return Collection<int, User>
     */
    public function index(): Collection
    {
        return $this->userIndexQuery->handle();
    }

    public function store(array $validated): User
    {
        return $this->createUser->handle($validated);
    }

    public function update(User $user, array $validated): User
    {
        return $this->updateUser->handle($user, $validated);
    }

    public function delete(User $user): void
    {
        $this->deleteUser->handle($user);
    }

    public function deactivate(User $user): User
    {
        return $this->deactivateUser->handle($user);
    }

    public function activate(User $user): User
    {
        return $this->activateUser->handle($user);
    }
}
