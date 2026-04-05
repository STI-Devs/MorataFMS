<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request using a temporary bearer token.
     *
     * This is a deployment workaround for Railway's public-suffix domains.
     * Revert to Sanctum's cookie-based SPA auth after a shared custom domain is available.
     */
    public function store(LoginRequest $request): JsonResponse
    {
        $user = $request->authenticate();
        $token = $user->createToken('frontend-session', ['*']);

        return response()->json([
            'token' => $token->plainTextToken,
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Revoke the current bearer token for the active frontend session.
     */
    public function destroy(Request $request): Response
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->noContent();
    }
}
