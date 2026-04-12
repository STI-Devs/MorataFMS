<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

test('authenticated user can update their profile job title', function () {
    $user = User::factory()->create([
        'role' => 'admin',
        'job_title' => 'Lawyer',
    ]);

    $response = $this->actingAs($user)
        ->putJson('/api/user/profile', [
            'name' => 'Updated Admin',
            'job_title' => 'Managing Partner',
        ])
        ->assertOk();

    $response->assertJsonPath('data.name', 'Updated Admin');
    $response->assertJsonPath('data.job_title', 'Managing Partner');
    $response->assertJsonPath('data.role', 'admin');

    expect($user->fresh()->job_title)->toBe('Managing Partner');
});

test('authenticated user must confirm the current password to change their password', function () {
    $user = User::factory()->create([
        'role' => 'admin',
        'password' => bcrypt('current-password'),
    ]);

    $this->actingAs($user)
        ->putJson('/api/user/profile', [
            'current_password' => 'wrong-password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['current_password']);
});

test('changing the password clears other database sessions for the user', function () {
    config()->set('session.driver', 'database');

    $user = User::factory()->create([
        'role' => 'admin',
        'email' => 'admin@example.com',
        'password' => bcrypt('current-password'),
    ]);

    $headers = [
        'Accept' => 'application/json',
        'Origin' => 'http://localhost:3000',
        'Referer' => 'http://localhost:3000/settings',
    ];

    $this->withHeaders($headers)->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'current-password',
    ])->assertOk();

    $currentSessionId = DB::table('sessions')
        ->where('user_id', $user->id)
        ->orderByDesc('last_activity')
        ->value('id');

    DB::table('sessions')->insert([
        'id' => 'other-session',
        'user_id' => $user->id,
        'ip_address' => '127.0.0.2',
        'user_agent' => 'test-agent-2',
        'payload' => 'payload',
        'last_activity' => time(),
    ]);

    $this->withHeaders($headers)->putJson('/api/user/profile', [
        'current_password' => 'current-password',
        'password' => 'new-password-123',
        'password_confirmation' => 'new-password-123',
    ])->assertOk();

    expect(DB::table('sessions')->where('id', 'other-session')->exists())->toBeFalse();
});
