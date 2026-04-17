<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveUserSession
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user !== null && $user->is_active === false) {
            Auth::guard('web')->logout();

            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            if ($request->expectsJson()) {
                return new JsonResponse([
                    'message' => 'Unauthenticated.',
                ], 401);
            }

            throw new AuthenticationException('Unauthenticated.');
        }

        return $next($request);
    }
}
