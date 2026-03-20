<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
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
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return new UserResource($user);
    }
}
