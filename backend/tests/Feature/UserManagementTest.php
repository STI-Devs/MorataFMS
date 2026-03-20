<?php

use App\Models\User;

test('creating a paralegal user returns normalized departments and permissions', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)
        ->postJson('/api/users', [
            'name' => 'Legal Staff',
            'email' => 'legal.staff@morata.com',
            'job_title' => 'Legal Assistant',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'paralegal',
        ])
        ->assertCreated();

    $response->assertJsonPath('data.role', 'paralegal');
    $response->assertJsonPath('data.job_title', 'Legal Assistant');
    $response->assertJsonPath('data.departments', ['legal']);
    $response->assertJsonPath('data.permissions.access_legal_module', true);
    $response->assertJsonPath('data.permissions.access_brokerage_module', false);
    $response->assertJsonPath('data.permissions.manage_notarial_entries', true);
    $response->assertJsonPath('data.permissions.manage_notarial_books', false);
});

test('updating a user role re-syncs departments and permission payload', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'encoder']);

    $response = $this->actingAs($admin)
        ->putJson("/api/users/{$user->id}", [
            'role' => 'admin',
            'job_title' => 'Lawyer',
        ])
        ->assertOk();

    $response->assertJsonPath('data.role', 'admin');
    $response->assertJsonPath('data.job_title', 'Lawyer');
    $response->assertJsonPath('data.departments', ['brokerage', 'legal']);
    $response->assertJsonPath('data.permissions.manage_users', true);
    $response->assertJsonPath('data.permissions.view_audit_logs', true);

    expect($user->fresh()->departments)->toBe(['brokerage', 'legal']);
    expect($user->fresh()->job_title)->toBe('Lawyer');
});
