<?php

use App\Http\Middleware\EnsureActiveUserSession;
use App\Http\Middleware\EnsureEmailIsVerified;
use App\Http\Middleware\MaxRequestSize;
use App\Http\Middleware\SecurityHeaders;
use App\Http\Middleware\ThrottlePublicSurface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Request as SymfonyRequest;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

$trustedProxies = array_values(array_filter(array_map(
    static fn (string $proxy): ?string => ($proxy = trim($proxy)) !== ''
        ? $proxy
        : null,
    explode(',', (string) env('APP_TRUSTED_PROXIES', ''))
)));

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: null,
    )
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        ['prefix' => 'api', 'middleware' => ['api', 'auth:sanctum', EnsureActiveUserSession::class]],
    )
    ->withMiddleware(function (Middleware $middleware) use ($trustedProxies): void {
        $middleware->trustProxies(
            headers: SymfonyRequest::HEADER_X_FORWARDED_FOR |
                     SymfonyRequest::HEADER_X_FORWARDED_HOST |
                     SymfonyRequest::HEADER_X_FORWARDED_PORT |
                     SymfonyRequest::HEADER_X_FORWARDED_PROTO,
            at: $trustedProxies,
        );

        $middleware->trustHosts(
            at: fn (): array => config('app.enforce_trusted_hosts')
                ? config('app.trusted_hosts')
                : ['.*'],
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
            'active-session' => EnsureActiveUserSession::class,
            'verified' => EnsureEmailIsVerified::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $shouldRenderJsonForApiRequest = static function (Request $request): bool {
            return $request->is('api/*') || $request->is('sanctum/*');
        };

        $shouldRenderPlainTextForBrowserApiRequest = static function (Request $request) use ($shouldRenderJsonForApiRequest): bool {
            return $shouldRenderJsonForApiRequest($request) && ! $request->expectsJson();
        };

        $plainTextApiResponse = static function (string $message, int $status) {
            return response($message.PHP_EOL, $status, [
                'Content-Type' => 'text/plain; charset=UTF-8',
            ]);
        };

        $plainTextWebResponse = static function (string $message, int $status) {
            return response($message.PHP_EOL, $status, [
                'Content-Type' => 'text/plain; charset=UTF-8',
            ]);
        };

        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $exception) use ($shouldRenderJsonForApiRequest): bool {
            return $shouldRenderJsonForApiRequest($request) || $request->expectsJson();
        });

        $exceptions->render(function (AuthenticationException $exception, Request $request) use ($shouldRenderPlainTextForBrowserApiRequest, $plainTextApiResponse) {
            if (! $shouldRenderPlainTextForBrowserApiRequest($request)) {
                return null;
            }

            return $plainTextApiResponse('Authentication required.', 401);
        });

        $exceptions->render(function (AuthorizationException $exception, Request $request) use ($shouldRenderPlainTextForBrowserApiRequest, $plainTextApiResponse) {
            if (! $shouldRenderPlainTextForBrowserApiRequest($request)) {
                return null;
            }

            return $plainTextApiResponse('Forbidden.', 403);
        });

        $exceptions->render(function (MethodNotAllowedHttpException $exception, Request $request) use ($shouldRenderJsonForApiRequest, $shouldRenderPlainTextForBrowserApiRequest, $plainTextApiResponse) {
            if ($shouldRenderPlainTextForBrowserApiRequest($request)) {
                return $plainTextApiResponse('Method not allowed.', 405);
            }

            if (! $shouldRenderJsonForApiRequest($request)) {
                return null;
            }

            return response()->json([
                'message' => 'Method not allowed.',
            ], 405);
        });

        $exceptions->render(function (NotFoundHttpException $exception, Request $request) use ($shouldRenderJsonForApiRequest, $shouldRenderPlainTextForBrowserApiRequest, $plainTextApiResponse, $plainTextWebResponse) {
            if ($shouldRenderPlainTextForBrowserApiRequest($request)) {
                return $plainTextApiResponse('Route not found.', 404);
            }

            if (! $shouldRenderJsonForApiRequest($request)) {
                return $plainTextWebResponse('Not found.', 404);
            }

            return response()->json([
                'message' => 'Not found.',
            ], 404);
        });
    })->create();
