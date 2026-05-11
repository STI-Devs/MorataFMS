<?php

namespace App\Http\Controllers\Users;

use App\Http\Controllers\Controller;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Http\Resources\Users\UserResource;
use App\Models\User;
use App\Orchestrators\Users\UserOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    public function __construct(
        private UserOrchestrator $users,
    ) {}

    /**
     * List all users (admin only).
     */
    public function index(): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        return UserResource::collection($this->users->index());
    }

    /**
     * Create a new user (admin only).
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        return (new UserResource($this->users->store($request->validated())))
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

        return new UserResource($this->users->update($user, $request->validated()));
    }

    /**
     * Delete a user (admin only).
     */
    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $this->users->delete($user);

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

        return new UserResource($this->users->deactivate($user));
    }

    /**
     * POST /api/users/{user}/activate
     * Re-enable a deactivated user account (admin only).
     */
    public function activate(User $user): UserResource
    {
        $this->authorize('update', $user);

        return new UserResource($this->users->activate($user));
    }
}
