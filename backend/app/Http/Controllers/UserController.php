<?php

namespace App\Http\Controllers;

use App\Actions\Users\ActivateUser;
use App\Actions\Users\CreateUser;
use App\Actions\Users\DeactivateUser;
use App\Actions\Users\DeleteUser;
use App\Actions\Users\UpdateUser;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Queries\Users\UserIndexQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
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
     * List all users (admin only).
     */
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        return UserResource::collection($this->userIndexQuery->handle());
    }

    /**
     * Create a new user (admin only).
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $user = $this->createUser->handle($request->validated());

        return (new UserResource($user))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Show a single user (admin only).
     */
    public function show(User $user): UserResource
    {
        $this->authorize('viewAny', User::class);

        return new UserResource($user);
    }

    /**
     * Update a user (admin only).
     */
    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $this->authorize('update', $user);

        $user = $this->updateUser->handle($user, $request->validated());

        return new UserResource($user);
    }

    /**
     * Delete a user (admin only).
     */
    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $this->deleteUser->handle($user);

        return response()->json(['message' => 'User deleted successfully.']);
    }

    /**
     * POST /api/users/{user}/deactivate
     * Soft-disable a user account (admin only).
     * Guard: cannot deactivate the last active admin in the system.
     */
    public function deactivate(User $user): UserResource
    {
        $this->authorize('update', $user);

        $user = $this->deactivateUser->handle($user);

        return new UserResource($user);
    }

    /**
     * POST /api/users/{user}/activate
     * Re-enable a deactivated user account (admin only).
     */
    public function activate(User $user): UserResource
    {
        $this->authorize('update', $user);

        $user = $this->activateUser->handle($user);

        return new UserResource($user);
    }
}
