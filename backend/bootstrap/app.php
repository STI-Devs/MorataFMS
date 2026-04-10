<?php

use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\MaxRequestSize;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\ThrottlePublicSurface;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        ['prefix' => 'api', 'middleware' => ['api', 'auth:sanctum']],
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust the cloud proxy chain so Laravel honors forwarded scheme, host,
        // and client IP information behind Cloudflare and Railway.
        // This improves URL generation, secure-cookie handling, and request IP
        // resolution, but forwarded IPs should still be treated as best-effort
        // origin metadata rather than a hard security identity.
        $middleware->trustProxies(
            headers: Request::HEADER_X_FORWARDED_FOR |
                     Request::HEADER_X_FORWARDED_HOST |
                     Request::HEADER_X_FORWARDED_PORT |
                     Request::HEADER_X_FORWARDED_PROTO,
            at: '*',
        );

        $middleware->trustHosts(
            at: fn (): array => config('app.trusted_hosts'),
            subdomains: false,
        );

        $middleware->statefulApi();

        $middleware->api(prepend: [
            MaxRequestSize::class,
        ]);

        $middleware->append(ThrottlePublicSurface::class);

        // Global: attach security headers to every response
        $middleware->append(SecurityHeaders::class);

        $middleware->alias([
            'verified' => EnsureEmailIsVerified::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $shouldRenderJsonForApiRequest = static function (Request $request): bool {
            return $request->is('api/*') || $request->is('sanctum/*');
        };

        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $exception) use ($shouldRenderJsonForApiRequest): bool {
            return $shouldRenderJsonForApiRequest($request) || $request->expectsJson();
        });

        $exceptions->render(function (MethodNotAllowedHttpException $exception, Request $request) use ($shouldRenderJsonForApiRequest) {
            if (! $shouldRenderJsonForApiRequest($request)) {
                return null;
            }

            return response()->json([
                'message' => 'Method not allowed.',
            ], 405);
        });

        $exceptions->render(function (NotFoundHttpException $exception, Request $request) use ($shouldRenderJsonForApiRequest) {
            if (! $shouldRenderJsonForApiRequest($request)) {
                return null;
            }

            return response()->json([
                'message' => 'Not found.',
            ], 404);
        });
    })->create();
