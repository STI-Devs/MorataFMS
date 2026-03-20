<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * List all users (admin only).
     */
    public function index()
    {
        $this->authorize('viewAny', User::class);

        $users = User::orderBy('name')->get();

        return UserResource::collection($users);
    }

    /**
     * Create a new user (admin only).
     */
    public function store(StoreUserRequest $request)
    {
        $this->authorize('create', User::class);

        $validated = $request->validated();

        $user = new User([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'job_title' => $validated['job_title'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);
        $user->role = UserRole::from($validated['role']);
        $user->save();

        return (new UserResource($user))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Show a single user (admin only).
     */
    public function show(User $user)
    {
        $this->authorize('viewAny', User::class);

        return new UserResource($user);
    }

    /**
     * Update a user (admin only).
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        $this->authorize('update', $user);

        $validated = $request->validated();

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

        return new UserResource($user);
    }

    /**
     * Delete a user (admin only).
     */
    public function destroy(User $user)
    {
        $this->authorize('delete', $user);

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }

    /**
     * POST /api/users/{user}/deactivate
     * Soft-disable a user account (admin only).
     * Guard: cannot deactivate the last active admin in the system.
     */
    public function deactivate(User $user)
    {
        $this->authorize('update', $user);

        // Prevent locking out the entire system by deactivating the last active admin.
        if ($user->role === UserRole::Admin) {
            $activeAdminCount = User::where('role', UserRole::Admin->value)
                ->where('is_active', true)
                ->count();

            if ($activeAdminCount <= 1) {
                return response()->json([
                    'message' => 'Cannot deactivate the last active admin account. Assign another admin first.',
                ], 422);
            }
        }

        $user->is_active = false;
        $user->save();

        return new UserResource($user);
    }

    /**
     * POST /api/users/{user}/activate
     * Re-enable a deactivated user account (admin only).
     */
    public function activate(User $user)
    {
        $this->authorize('update', $user);

        $user->is_active = true;
        $user->save();

        return new UserResource($user);
    }
}
