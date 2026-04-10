<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config([
        'services.turnstile.enabled' => false,
        'services.turnstile.secret_key' => null,
    ]);
});

function frontendHeaders(): array
{
    return [
        'Accept' => 'application/json',
        'Origin' => 'http://localhost:3000',
        'Referer' => 'http://localhost:3000/login',
    ];
}

test('login returns the user resource payload without a bearer token', function () {
    $user = User::factory()->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
        'role' => 'admin',
    ]);

    $response = $this
        ->withHeaders(frontendHeaders())
        ->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])
        ->assertOk();

    $response->assertJsonPath('user.email', $user->email);
    $response->assertJsonPath('user.role', 'admin');

    expect($response->json('token'))->toBeNull();
    $this->assertAuthenticatedAs($user);
});

test('current user endpoint accepts the authenticated session after login and a follow-up request', function () {
    $user = User::factory()->create([
        'email' => 'encoder@example.com',
        'password' => bcrypt('password'),
        'role' => 'encoder',
    ]);

    $this
        ->withHeaders(frontendHeaders())
        ->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])
        ->assertOk();

    Auth::forgetGuards();

    $response = $this
        ->withHeaders(frontendHeaders())
        ->getJson('/api/user')
        ->assertOk();

    $response->assertJsonPath('data.email', $user->email);
    $response->assertJsonPath('data.role', 'encoder');
});

test('logout invalidates the session and makes the current user endpoint unauthenticated', function () {
    $user = User::factory()->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
    ]);

    $this
        ->withHeaders(frontendHeaders())
        ->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])
        ->assertOk();

    $this
        ->withHeaders(frontendHeaders())
        ->postJson('/api/auth/logout')
        ->assertNoContent();

    Auth::forgetGuards();

    $this
        ->withHeaders(frontendHeaders())
        ->getJson('/api/user')
        ->assertUnauthorized();
});

test('login rejects invalid credentials with the existing validation message', function () {
    $user = User::factory()->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
    ]);

    $response = $this
        ->withHeaders(frontendHeaders())
        ->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])
        ->assertStatus(422);

    $response->assertJsonValidationErrors(['email']);
    $response->assertJsonPath('errors.email.0', trans('auth.failed'));
});

test('login rejects deactivated users', function () {
    $user = User::factory()->create([
        'email' => 'inactive@example.com',
        'password' => bcrypt('password'),
        'is_active' => false,
    ]);

    $response = $this
        ->withHeaders(frontendHeaders())
        ->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])
        ->assertStatus(422);

    $response->assertJsonValidationErrors(['email']);
    $response->assertJsonPath('errors.email.0', 'Your account has been deactivated. Please contact an administrator.');
    $this->assertGuest();
});

test('login requires a turnstile token when turnstile protection is enabled', function () {
    config([
        'services.turnstile.enabled' => true,
        'services.turnstile.secret_key' => 'secret',
    ]);

    $user = User::factory()->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
    ]);

    $response = $this
        ->withHeaders(frontendHeaders())
        ->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])
        ->assertStatus(422);

    $response->assertJsonValidationErrors(['turnstile_token']);
    $response->assertJsonPath('errors.turnstile_token.0', 'The turnstile token field is required.');
    Http::assertNothingSent();
});

test('login rejects invalid turnstile verification responses', function () {
    config([
        'services.turnstile.enabled' => true,
        'services.turnstile.secret_key' => 'secret',
    ]);

    Http::fake([
        'https://challenges.cloudflare.com/turnstile/v0/siteverify' => Http::response([
            'success' => false,
        ]),
    ]);

    $user = User::factory()->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
    ]);

    $response = $this
        ->withHeaders(frontendHeaders())
        ->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            'turnstile_token' => 'invalid-token',
        ])
        ->assertStatus(422);

    $response->assertJsonValidationErrors(['turnstile_token']);
    $response->assertJsonPath('errors.turnstile_token.0', 'Complete the security check and try again.');
    $this->assertGuest();
});

test('login succeeds when turnstile verification passes', function () {
    config([
        'services.turnstile.enabled' => true,
        'services.turnstile.secret_key' => 'secret',
    ]);

    Http::fake([
        'https://challenges.cloudflare.com/turnstile/v0/siteverify' => Http::response([
            'success' => true,
        ]),
    ]);

    $user = User::factory()->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
        'role' => 'admin',
    ]);

    $response = $this
        ->withHeaders(frontendHeaders())
        ->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            'turnstile_token' => 'valid-token',
        ])
        ->assertOk();

    $response->assertJsonPath('user.email', $user->email);
    Http::assertSent(function ($request) {
        return $request->url() === 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
            && $request['response'] === 'valid-token'
            && $request['secret'] === 'secret'
            && is_string($request['remoteip']);
    });
});
