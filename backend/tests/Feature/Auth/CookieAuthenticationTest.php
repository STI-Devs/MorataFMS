<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;

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
