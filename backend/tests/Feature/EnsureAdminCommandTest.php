<?php

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('ops ensure admin creates an active admin account', function () {
    $this->artisan('ops:ensure-admin', [
        'email' => 'support@example.com',
        '--name' => 'Support Admin',
        '--job-title' => 'Support Administrator',
        '--password' => 'SecretPass1234',
    ])
        ->expectsOutputToContain('Admin account created.')
        ->expectsOutputToContain('Email: support@example.com')
        ->assertSuccessful();

    $user = User::query()->where('email', 'support@example.com')->first();

    expect($user)->not->toBeNull();
    expect($user->role)->toBe(UserRole::Admin);
    expect($user->is_active)->toBeTrue();
    expect($user->name)->toBe('Support Admin');
    expect($user->job_title)->toBe('Support Administrator');
    expect(Hash::check('SecretPass1234', $user->password))->toBeTrue();
});

test('ops ensure admin promotes an existing user and rotates the password', function () {
    $user = User::factory()->create([
        'email' => 'encoder@example.com',
        'role' => UserRole::Encoder,
        'is_active' => false,
        'job_title' => 'Encoder',
    ]);

    $this->artisan('ops:ensure-admin', [
        'email' => $user->email,
        '--name' => 'Recovered Admin',
        '--job-title' => 'Administrator',
        '--password' => 'RecoveredPass1234',
    ])
        ->expectsOutputToContain('Admin account updated.')
        ->expectsOutputToContain('Status: active')
        ->assertSuccessful();

    $user->refresh();

    expect($user->role)->toBe(UserRole::Admin);
    expect($user->is_active)->toBeTrue();
    expect($user->name)->toBe('Recovered Admin');
    expect($user->job_title)->toBe('Administrator');
    expect(Hash::check('RecoveredPass1234', $user->password))->toBeTrue();
});
