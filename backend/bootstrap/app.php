<?php

use App\Http\Controllers\SystemController;
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
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Request as SymfonyRequest;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
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
        commands: __DIR__.'/../routes/console.php',
        health: null,
        using: function (): void {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));

            Route::get('/up', [SystemController::class, 'health']);
            Route::get('/', [SystemController::class, 'index']);
        },
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

        $exceptions->render(function (BadRequestHttpException $exception, Request $request) use ($shouldRenderJsonForApiRequest, $shouldRenderPlainTextForBrowserApiRequest, $plainTextApiResponse) {
            if ($shouldRenderPlainTextForBrowserApiRequest($request)) {
                return $plainTextApiResponse('Bad request.', 400);
            }

            if (! $shouldRenderJsonForApiRequest($request)) {
                return null;
            }

            return response()->json([
                'message' => 'Bad request.',
            ], 400);
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

        $exceptions->render(function (Throwable $exception, Request $request) use ($shouldRenderJsonForApiRequest, $shouldRenderPlainTextForBrowserApiRequest, $plainTextApiResponse) {
            if (! $shouldRenderJsonForApiRequest($request)) {
                return null;
            }

            if (
                $exception instanceof AuthenticationException ||
                $exception instanceof AuthorizationException ||
                $exception instanceof ValidationException ||
                $exception instanceof HttpExceptionInterface
            ) {
                return null;
            }

            if ($shouldRenderPlainTextForBrowserApiRequest($request)) {
                return $plainTextApiResponse('Server error.', 500);
            }

            return response()->json([
                'message' => 'Server error.',
            ], 500);
        });
    })->create();
