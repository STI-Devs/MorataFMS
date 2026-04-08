<?php

namespace App\Http\Requests\Auth;

use App\Support\Security\TurnstileVerifier;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'turnstile_token' => [
                Rule::requiredIf($this->turnstileEnabled()),
                'string',
            ],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(TurnstileVerifier $turnstileVerifier): void
    {
        $this->ensureIsNotRateLimited();
        $this->ensureTurnstileIsValid($turnstileVerifier);

        if (! Auth::attempt($this->only('email', 'password'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        // Block deactivated accounts even if credentials are valid.
        if (! Auth::user()?->is_active) {
            Auth::logout();
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => 'Your account has been deactivated. Please contact an administrator.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure Turnstile has been completed and verified when the protection is enabled.
     *
     * @throws ValidationException
     */
    public function ensureTurnstileIsValid(TurnstileVerifier $turnstileVerifier): void
    {
        if (! $turnstileVerifier->enabled()) {
            return;
        }

        $token = $this->input('turnstile_token');

        if ($turnstileVerifier->verify(is_string($token) ? $token : null, (string) $this->ip())) {
            return;
        }

        RateLimiter::hit($this->throttleKey());

        throw ValidationException::withMessages([
            'turnstile_token' => 'Complete the security check and try again.',
        ]);
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->input('email')).'|'.$this->ip());
    }

    private function turnstileEnabled(): bool
    {
        return (bool) config('services.turnstile.enabled')
            && filled(config('services.turnstile.secret_key'));
    }
}
