<?php

use App\Models\Client;
use App\Models\Country;
use App\Models\User;

test('authenticated users can list brokerage clients', function () {
    $encoder = User::factory()->encoder()->create();
    $country = Country::factory()->create([
        'name' => 'Philippines',
        'code' => 'PH',
    ]);

    Client::factory()->importer()->create([
        'name' => 'Acme Imports',
        'country_id' => $country->id,
    ]);

    $this->actingAs($encoder)
        ->getJson('/api/brokerage-clients')
        ->assertSuccessful()
        ->assertJsonPath('data.0.name', 'Acme Imports')
        ->assertJsonPath('data.0.country.name', 'Philippines');
});

test('unauthenticated users cannot list brokerage clients', function () {
    Client::factory()->create();

    $this->getJson('/api/brokerage-clients')
        ->assertUnauthorized();
});

test('admin can show a brokerage client through the resource route', function () {
    $admin = User::factory()->admin()->create();
    $client = Client::factory()->create(['name' => 'Binding Check Client']);

    $this->actingAs($admin)
        ->getJson("/api/brokerage-clients/{$client->id}")
        ->assertSuccessful()
        ->assertJsonPath('data.name', 'Binding Check Client');
});

test('admin can update a brokerage client through the resource route', function () {
    $admin = User::factory()->admin()->create();
    $client = Client::factory()->importer()->create(['name' => 'Old Client Name']);

    $this->actingAs($admin)
        ->putJson("/api/brokerage-clients/{$client->id}", [
            'name' => 'Updated Client Name',
            'type' => 'exporter',
        ])
        ->assertSuccessful()
        ->assertJsonPath('data.name', 'Updated Client Name')
        ->assertJsonPath('data.type', 'exporter');
});

test('admin can delete a brokerage client through the resource route', function () {
    $admin = User::factory()->admin()->create();
    $client = Client::factory()->create();

    $this->actingAs($admin)
        ->deleteJson("/api/brokerage-clients/{$client->id}")
        ->assertNoContent();

    $this->assertModelMissing($client);
});
