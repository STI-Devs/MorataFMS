<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    /**
     * GET /api/user
     */
    public function show(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    /**
     * PUT /api/user/profile
     * Update the authenticated user's name, job title, and/or password.
     */
    public function update(UpdateProfileRequest $request): UserResource
    {
        $user = $request->user();
        $validated = $request->validated();

        if (! empty($validated['name'])) {
            $user->name = $validated['name'];
        }

        if (array_key_exists('job_title', $validated)) {
            $user->job_title = filled($validated['job_title']) ? trim($validated['job_title']) : null;
        }

        if (! empty($validated['password'])) {
            Auth::guard('web')->logoutOtherDevices($validated['current_password']);

            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        if (! empty($validated['password']) && config('session.driver') === 'database') {
            $currentSessionId = $request->hasSession() ? $request->session()->getId() : null;

            DB::table((string) config('session.table', 'sessions'))
                ->where('user_id', $user->getKey())
                ->when(
                    $currentSessionId !== null,
                    fn ($query) => $query->where('id', '!=', $currentSessionId),
                )
                ->delete();
        }

        return new UserResource($user);
    }
}
