<?php

use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;

test('login returns a bearer token and user resource payload', function () {
    $user = User::factory()->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
        'role' => 'admin',
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertOk();

    $response->assertJsonPath('user.email', $user->email);
    $response->assertJsonPath('user.role', 'admin');

    expect($response->json('token'))
        ->toBeString()
        ->toContain('|');

    expect($user->tokens()->count())->toBe(1);
});

test('login rejects invalid credentials with the existing validation message', function () {
    $user = User::factory()->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ])->assertStatus(422);

    $response->assertJsonValidationErrors(['email']);
    $response->assertJsonPath('errors.email.0', trans('auth.failed'));
});

test('login rejects deactivated users', function () {
    $user = User::factory()->create([
        'email' => 'inactive@example.com',
        'password' => bcrypt('password'),
        'is_active' => false,
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertStatus(422);

    $response->assertJsonValidationErrors(['email']);
    $response->assertJsonPath('errors.email.0', 'Your account has been deactivated. Please contact an administrator.');
});

test('current user endpoint accepts a bearer token', function () {
    $user = User::factory()->create([
        'email' => 'encoder@example.com',
        'password' => bcrypt('password'),
        'role' => 'encoder',
    ]);

    $token = $user->createToken('frontend-session', ['*'])->plainTextToken;

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/user')
        ->assertOk();

    $response->assertJsonPath('data.email', $user->email);
    $response->assertJsonPath('data.role', 'encoder');
});

test('logout revokes only the current bearer token', function () {
    $user = User::factory()->create([
        'email' => 'admin@example.com',
        'password' => bcrypt('password'),
    ]);

    $currentToken = $user->createToken('frontend-session', ['*']);
    $otherToken = $user->createToken('another-device', ['*']);

    $this->withHeader('Authorization', "Bearer {$currentToken->plainTextToken}")
        ->postJson('/api/auth/logout')
        ->assertNoContent();

    expect(PersonalAccessToken::query()->whereKey($currentToken->accessToken->getKey())->exists())->toBeFalse();
    expect(PersonalAccessToken::query()->whereKey($otherToken->accessToken->getKey())->exists())->toBeTrue();
});
