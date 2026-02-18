<?php

use App\Models\Client;
use App\Models\Country;
use App\Models\ExportTransaction;
use App\Models\User;

// --- Authentication Guard ---

test('unauthenticated users cannot list export transactions', function () {
    $this->getJson('/api/export-transactions')
        ->assertUnauthorized();
});

test('unauthenticated users cannot create export transactions', function () {
    $this->postJson('/api/export-transactions', [])
        ->assertUnauthorized();
});

// --- Index (List) ---

test('authenticated users can list export transactions', function () {
    $user = User::factory()->create();
    ExportTransaction::factory()->count(3)->create();

    $response = $this->actingAs($user)
        ->getJson('/api/export-transactions');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'bl_no', 'vessel', 'shipper', 'status'],
            ],
        ]);
});

test('export transactions can be searched by vessel name', function () {
    $user = User::factory()->create();
    ExportTransaction::factory()->create(['vessel' => 'MV Explorer']);
    ExportTransaction::factory()->create(['vessel' => 'MV Atlantic']);

    $response = $this->actingAs($user)
        ->getJson('/api/export-transactions?search=Explorer');

    $response->assertOk();
    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['vessel'])->toBe('MV Explorer');
});

test('export transactions can be filtered by status', function () {
    $user = User::factory()->create();
    ExportTransaction::factory()->pending()->count(2)->create();
    ExportTransaction::factory()->completed()->create();

    $response = $this->actingAs($user)
        ->getJson('/api/export-transactions?status=pending');

    $response->assertOk();
    $data = $response->json('data');
    expect($data)->toHaveCount(2);
});

// --- Store (Create) ---

test('authenticated users can create export transactions with valid data', function () {
    $user = User::factory()->create();
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $payload = [
        'shipper_id' => $client->id,
        'bl_no' => 'BL-EXP-12345',
        'vessel' => 'MV Pacific Star',
        'destination_country_id' => $country->id,
    ];

    $response = $this->actingAs($user)
        ->postJson('/api/export-transactions', $payload);

    $response->assertCreated()
        ->assertJsonPath('data.bl_no', 'BL-EXP-12345')
        ->assertJsonPath('data.vessel', 'MV Pacific Star')
        ->assertJsonPath('data.status', 'pending')
        ->assertJsonPath('data.shipper.id', $client->id)
        ->assertJsonPath('data.shipper.name', $client->name);

    $this->assertDatabaseHas('export_transactions', [
        'bl_no' => 'BL-EXP-12345',
        'vessel' => 'MV Pacific Star',
        'assigned_user_id' => $user->id,
    ]);
});

test('creating an export transaction auto-creates stages', function () {
    $user = User::factory()->create();
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $this->actingAs($user)->postJson('/api/export-transactions', [
        'shipper_id' => $client->id,
        'bl_no' => 'BL-STAGE-EXP-001',
        'vessel' => 'MV Stage Test',
        'destination_country_id' => $country->id,
    ]);

    $transaction = ExportTransaction::where('bl_no', 'BL-STAGE-EXP-001')->first();
    expect($transaction)->not->toBeNull();
    expect($transaction->stages)->not->toBeNull();
    expect($transaction->stages->docs_prep_status)->toBe('pending');
});

// --- Validation ---

test('creating export transaction fails without required fields', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->postJson('/api/export-transactions', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors([
            'shipper_id',
            'bl_no',
            'vessel',
            'destination_country_id',
        ]);
});

test('creating export transaction fails with non-existent shipper', function () {
    $user = User::factory()->create();
    $country = Country::factory()->create();

    $response = $this->actingAs($user)
        ->postJson('/api/export-transactions', [
            'shipper_id' => 99999,
            'bl_no' => 'BL-001',
            'vessel' => 'MV Test',
            'destination_country_id' => $country->id,
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['shipper_id']);
});

// --- Security: Mass Assignment Protection ---

test('mass assignment of status is ignored on create', function () {
    $user = User::factory()->create();
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $response = $this->actingAs($user)
        ->postJson('/api/export-transactions', [
            'shipper_id' => $client->id,
            'bl_no' => 'BL-HACK-EXP-001',
            'vessel' => 'MV Hacker Ship',
            'destination_country_id' => $country->id,
            'status' => 'completed', // Attacker trying to skip workflow
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'pending'); // Server always sets 'pending'
});

test('mass assignment of assigned_user_id is ignored on create', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $response = $this->actingAs($user)
        ->postJson('/api/export-transactions', [
            'shipper_id' => $client->id,
            'bl_no' => 'BL-HACK-EXP-002',
            'vessel' => 'MV Spoof Ship',
            'destination_country_id' => $country->id,
            'assigned_user_id' => $otherUser->id, // Attacker trying to assign to someone else
        ]);

    $response->assertCreated();

    $transaction = ExportTransaction::where('bl_no', 'BL-HACK-EXP-002')->first();
    expect($transaction->assigned_user_id)->toBe($user->id); // Server uses authenticated user
});
