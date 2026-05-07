<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class EnrichLogContext
{
    /**
     * Push request-scoped metadata into the Context facade so log entries,
     * queued jobs, and downstream services automatically carry the same
     * identifiers without manual wiring.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        Context::add('request_id', $this->resolveRequestId($request));

        if (($user = $request->user()) !== null) {
            Context::add('user_id', $user->id);
            Context::add('role', $user->role?->value);
        }

        return $next($request);
    }

    private function resolveRequestId(Request $request): string
    {
        $forwardedId = trim((string) $request->headers->get('X-Request-Id', ''));

        if ($forwardedId !== '') {
            return Str::limit($forwardedId, 64, '');
        }

        return (string) Str::uuid();
    }
}
