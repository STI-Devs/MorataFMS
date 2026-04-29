<?php

use App\Models\User;

test('unauthenticated requests cannot create a client', function () {
    $this->postJson('/api/brokerage-clients', [
        'name' => 'Acme Imports',
        'type' => 'importer',
    ])->assertUnauthorized();
});

test('admin can create a client', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->postJson('/api/brokerage-clients', [
            'name' => 'Acme Imports',
            'type' => 'importer',
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Acme Imports')
        ->assertJsonPath('data.is_active', true);

    $this->assertDatabaseHas('brokerage_clients', [
        'name' => 'Acme Imports',
        'type' => 'importer',
        'is_active' => true,
    ]);
});

test('encoder can create a client for on-the-fly archive registration', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);

    $this->actingAs($encoder)
        ->postJson('/api/brokerage-clients', [
            'name' => 'Acme Imports',
            'type' => 'importer',
        ])
        ->assertCreated();
});

test('processor can create a client', function () {
    $processor = User::factory()->create(['role' => 'processor']);

    $this->actingAs($processor)
        ->postJson('/api/brokerage-clients', [
            'name' => 'Acme Imports',
            'type' => 'importer',
        ])
        ->assertCreated();
});

test('accounting can create a client', function () {
    $accounting = User::factory()->create(['role' => 'accounting']);

    $this->actingAs($accounting)
        ->postJson('/api/brokerage-clients', [
            'name' => 'Acme Imports',
            'type' => 'importer',
        ])
        ->assertCreated();
});

test('paralegal cannot create a brokerage client', function () {
    $paralegal = User::factory()->create(['role' => 'paralegal']);

    $this->actingAs($paralegal)
        ->postJson('/api/brokerage-clients', [
            'name' => 'Acme Imports',
            'type' => 'importer',
        ])
        ->assertForbidden();

    $this->assertDatabaseMissing('brokerage_clients', [
        'name' => 'Acme Imports',
    ]);
});
