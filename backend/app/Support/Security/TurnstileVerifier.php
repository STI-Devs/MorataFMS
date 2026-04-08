<?php

namespace App\Support\Security;

use Illuminate\Support\Facades\Http;
use Throwable;

class TurnstileVerifier
{
    public function enabled(): bool
    {
        return (bool) config('services.turnstile.enabled')
            && filled(config('services.turnstile.secret_key'));
    }

    public function verify(?string $token, string $ipAddress): bool
    {
        if (! $this->enabled()) {
            return true;
        }

        if (! is_string($token) || trim($token) === '') {
            return false;
        }

        try {
            $response = Http::asForm()
                ->acceptJson()
                ->connectTimeout(5)
                ->timeout(5)
                ->post((string) config('services.turnstile.siteverify_url'), [
                    'secret' => config('services.turnstile.secret_key'),
                    'response' => $token,
                    'remoteip' => $ipAddress,
                ]);
        } catch (Throwable $exception) {
            report($exception);

            return false;
        }

        if (! $response->successful()) {
            return false;
        }

        return $response->json('success') === true;
    }
}
