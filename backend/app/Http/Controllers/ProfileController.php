<?php

namespace App\Http\Controllers;

use App\Actions\Users\UpdateProfile;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(
        private UpdateProfile $updateProfile,
    ) {}

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
        $user = $this->updateProfile->handle(
            $request->user(),
            $request->validated(),
            $request->hasSession() ? $request->session()->getId() : null,
        );

        return new UserResource($user);
    }
}
