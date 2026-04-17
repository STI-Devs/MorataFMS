<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Adds HTTP security headers to every response.
 * Mitigates clickjacking, MIME sniffing, and information leakage.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        $response->headers->set(
            'Content-Security-Policy',
            $this->isHtmlResponse($response)
                ? $this->htmlContentSecurityPolicy()
                : $this->apiContentSecurityPolicy(),
        );

        // Remove server fingerprint headers
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }

    private function isHtmlResponse(Response $response): bool
    {
        $contentType = strtolower((string) $response->headers->get('Content-Type', ''));

        return str_contains($contentType, 'text/html');
    }

    private function htmlContentSecurityPolicy(): string
    {
        return implode('; ', [
            "base-uri 'self'",
            "frame-ancestors 'self'",
            "form-action 'self'",
            "object-src 'none'",
        ]);
    }

    private function apiContentSecurityPolicy(): string
    {
        return implode('; ', [
            "default-src 'none'",
            "base-uri 'none'",
            "frame-ancestors 'none'",
            "form-action 'none'",
            "object-src 'none'",
        ]);
    }
}
