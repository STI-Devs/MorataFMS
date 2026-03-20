<?php

use App\Models\User;

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
