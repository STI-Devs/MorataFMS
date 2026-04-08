<?php

use App\Models\User;

test('api routes render json for direct browser method mismatches', function () {
    $response = $this->get('/api/auth/login');

    $response->assertStatus(405);
    expect($response->headers->get('content-type'))->toContain('application/json');
    $response->assertExactJson([
        'message' => 'Method not allowed.',
    ]);
});

test('api domain root does not expose the framework version', function () {
    $response = $this->get('/');

    $response->assertNotFound();
    expect($response->headers->get('content-type'))->toContain('application/json');
    $response->assertExactJson([
        'message' => 'Not found.',
    ]);
});

test('legacy root auth routes are not registered', function () {
    $this->post('/login')->assertNotFound();
});

test('scramble docs stay forbidden outside local by default', function () {
    $this->get('/docs/api')->assertForbidden();
});

test('admins can view scramble docs only when explicitly enabled', function () {
    config(['app.api_docs_enabled' => true]);

    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $this
        ->actingAs($admin)
        ->get('/docs/api')
        ->assertOk();
});

test('csrf bootstrap endpoint is rate limited at the public perimeter', function () {
    foreach (range(1, 60) as $attempt) {
        $this->get('/sanctum/csrf-cookie')->assertNoContent();
    }

    $this
        ->get('/sanctum/csrf-cookie')
        ->assertStatus(429)
        ->assertJson([
            'message' => 'Too many requests.',
        ]);
});
