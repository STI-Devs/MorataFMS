<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Cache\RateLimiter;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ThrottlePublicSurface
{
    /**
     * @var array<string, array{attempts: int, decay_seconds: int}>
     */
    private const BUCKETS = [
        'root' => ['attempts' => 10, 'decay_seconds' => 60],
        'health' => ['attempts' => 10, 'decay_seconds' => 60],
        'csrf' => ['attempts' => 60, 'decay_seconds' => 60],
        'docs' => ['attempts' => 10, 'decay_seconds' => 60],
    ];

    public function __construct(private RateLimiter $rateLimiter) {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $bucket = $this->resolveBucket($request);

        if ($bucket === null) {
            return $next($request);
        }

        $limit = self::BUCKETS[$bucket];
        $key = $this->rateLimitKey($bucket, $request);

        if ($this->rateLimiter->tooManyAttempts($key, $limit['attempts'])) {
            return response()->json([
                'message' => 'Too many requests.',
            ], 429, [
                'Retry-After' => (string) $this->rateLimiter->availableIn($key),
            ]);
        }

        $this->rateLimiter->hit($key, $limit['decay_seconds']);

        return $next($request);
    }

    private function resolveBucket(Request $request): ?string
    {
        if ($request->path() === '/') {
            return 'root';
        }

        if ($request->is('up')) {
            return 'health';
        }

        if ($request->is('sanctum/csrf-cookie')) {
            return 'csrf';
        }

        if ($request->is('docs/api') || $request->is('docs/api.json')) {
            return 'docs';
        }

        return null;
    }

    private function rateLimitKey(string $bucket, Request $request): string
    {
        return $bucket.':'.$request->ip();
    }
}
