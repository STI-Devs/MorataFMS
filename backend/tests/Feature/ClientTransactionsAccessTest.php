<?php

use App\Models\Client;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;

test('unauthenticated requests cannot list a client\'s transactions', function () {
    $client = Client::factory()->create();

    $this->getJson("/api/brokerage-clients/{$client->id}/transactions")
        ->assertUnauthorized();
});

test('admin can list a client\'s import and export transactions', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->create();

    $import = ImportTransaction::factory()->create(['importer_id' => $client->id]);
    $export = ExportTransaction::factory()->create(['shipper_id' => $client->id]);

    $response = $this->actingAs($admin)
        ->getJson("/api/brokerage-clients/{$client->id}/transactions")
        ->assertOk();

    expect(collect($response->json('transactions.imports'))->pluck('id')->all())
        ->toContain($import->id);
    expect(collect($response->json('transactions.exports'))->pluck('id')->all())
        ->toContain($export->id);
});

test('encoder cannot list a client\'s transactions even when one is assigned to them', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->create();

    ImportTransaction::factory()->create([
        'importer_id' => $client->id,
        'assigned_user_id' => $encoder->id,
    ]);

    $this->actingAs($encoder)
        ->getJson("/api/brokerage-clients/{$client->id}/transactions")
        ->assertForbidden();
});

test('processor cannot list a client\'s transactions', function () {
    $processor = User::factory()->create(['role' => 'processor']);
    $client = Client::factory()->create();

    ImportTransaction::factory()->create(['importer_id' => $client->id]);

    $this->actingAs($processor)
        ->getJson("/api/brokerage-clients/{$client->id}/transactions")
        ->assertForbidden();
});

test('accounting cannot list a client\'s transactions', function () {
    $accounting = User::factory()->create(['role' => 'accounting']);
    $client = Client::factory()->create();

    ImportTransaction::factory()->create(['importer_id' => $client->id]);

    $this->actingAs($accounting)
        ->getJson("/api/brokerage-clients/{$client->id}/transactions")
        ->assertForbidden();
});

test('paralegal cannot list a client\'s transactions', function () {
    $paralegal = User::factory()->create(['role' => 'paralegal']);
    $client = Client::factory()->create();

    ImportTransaction::factory()->create(['importer_id' => $client->id]);

    $this->actingAs($paralegal)
        ->getJson("/api/brokerage-clients/{$client->id}/transactions")
        ->assertForbidden();
});
