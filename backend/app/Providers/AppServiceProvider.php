<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;

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
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('app.frontend_url') . "/password-reset/$token?email={$notifiable->getEmailForPasswordReset()}";
        });

        Scramble::afterOpenApiGenerated(function (OpenApi $openApi) {
            $openApi->secure(
                SecurityScheme::http('bearer')
                    ->setDescription("### How to get a Test Token\n1. Open your terminal in the backend directory.\n2. Run `php artisan tinker`.\n3. Paste: `App\Models\User::first()->createToken('swagger-test')->plainTextToken;`\n4. Copy the long string output (e.g., `1|abc...`) and paste it here.")
            );
        });

        // Block destructive DB commands (migrate:fresh, db:wipe) on live environments.
        // This prevents accidental data loss on production and staging servers.
        if ($this->app->environment(['production', 'staging'])) {
            DB::prohibitDestructiveCommands();
        }

        // Force debug off on non-local environments even if .env is misconfigured.
        if (!$this->app->environment('local')) {
            config(['app.debug' => false]);
        }
    }
}
