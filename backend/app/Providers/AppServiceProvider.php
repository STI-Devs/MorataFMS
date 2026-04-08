<?php

namespace App\Providers;

use App\Models\User;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->bootRateLimiters();

        Gate::define('transactions.viewOversight', function (User $user): bool {
            return $user->isAdmin();
        });

        Gate::define('transactions.reassign', function (User $user): bool {
            return $user->isAdmin();
        });

        Gate::define('transactions.overrideStatus', function (User $user): bool {
            return $user->isAdmin();
        });

        Scramble::afterOpenApiGenerated(function (OpenApi $openApi) {
            $openApi->secure(
                SecurityScheme::http('bearer')
                    ->setDescription("### Temporary Frontend Auth Mode\nThe deployed frontend currently uses bearer tokens because Railway-provided domains cannot reliably support Sanctum's cookie SPA flow.\n\nSwitch this back to cookie auth once a purchased shared-root domain is available.\n\n### How to get a Test Token\n1. Call `POST /api/auth/login` with a valid email and password.\n2. Copy the returned `token` value (for example, `1|abc...`).\n3. Paste it here as `Bearer <token>`.")
            );
        });

        // Block destructive DB commands (migrate:fresh, db:wipe) on live environments.
        // This prevents accidental data loss on production and staging servers.
        if ($this->app->environment(['production', 'staging'])) {
            DB::prohibitDestructiveCommands();
        }

        // Force debug off on non-local environments even if .env is misconfigured.
        if (! $this->app->environment('local')) {
            config(['app.debug' => false]);
        }
    }

    private function bootRateLimiters(): void
    {
        RateLimiter::for('auth-login', function (Request $request) {
            return Limit::perMinute(20)->by('auth-login:'.$request->ip());
        });

        RateLimiter::for('auth-verification', function (Request $request) {
            return Limit::perMinute(6)->by('auth-verification:'.$this->rateLimitKey($request));
        });

        RateLimiter::for('api-general', function (Request $request) {
            return Limit::perMinute(90)->by('api-general:'.$this->rateLimitKey($request));
        });

        RateLimiter::for('api-admin', function (Request $request) {
            return Limit::perMinute(120)->by('api-admin:'.$this->rateLimitKey($request));
        });

        RateLimiter::for('api-search', function (Request $request) {
            return Limit::perMinute(45)->by('api-search:'.$this->rateLimitKey($request));
        });

        RateLimiter::for('api-documents', function (Request $request) {
            return Limit::perMinute(60)->by('api-documents:'.$this->rateLimitKey($request));
        });

        RateLimiter::for('archive-uploads', function (Request $request) {
            return Limit::perMinute(60)->by('archive-uploads:'.$this->rateLimitKey($request));
        });
    }

    private function rateLimitKey(Request $request): string
    {
        return (string) ($request->user()?->getAuthIdentifier() ?? $request->ip());
    }
}
