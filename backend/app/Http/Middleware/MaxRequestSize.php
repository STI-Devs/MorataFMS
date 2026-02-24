<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MaxRequestSize
{
    /**
     * Routes that are exempt from the size cap (e.g. future file uploads).
     * Matched against the request path using Str::is() wildcards.
     */
    private const EXEMPT_PATHS = [
        'api/documents*',
    ];

    /**
     * Default cap: 64 KB — plenty for any JSON payload in this app.
     * Override per-route via the middleware parameter if ever needed.
     */
    public function handle(Request $request, Closure $next, int $maxKb = 64): Response
    {
        foreach (self::EXEMPT_PATHS as $pattern) {
            if ($request->is($pattern)) {
                return $next($request);
            }
        }

        $contentLength = (int) $request->header('Content-Length', 0);

        if ($contentLength > $maxKb * 1024) {
            return response()->json([
                'message' => 'Payload too large.',
            ], 413);
        }

        return $next($request);
    }
}
