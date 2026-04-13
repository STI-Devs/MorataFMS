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

test('admin can list export transactions', function () {
    $user = User::factory()->create(['role' => 'admin']);
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

test('encoders can only list their own export transactions', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);

    $ownedTransaction = ExportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);
    ExportTransaction::factory()->create(['assigned_user_id' => $otherEncoder->id]);

    $response = $this->actingAs($encoder)
        ->getJson('/api/export-transactions');

    $response->assertOk()
        ->assertJsonPath('meta.total', 1);

    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['id'])->toBe($ownedTransaction->id);
});

test('export stats are scoped to the authenticated encoder', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);

    ExportTransaction::factory()->pending()->create(['assigned_user_id' => $encoder->id]);
    ExportTransaction::factory()->completed()->create(['assigned_user_id' => $otherEncoder->id]);

    $this->actingAs($encoder)
        ->getJson('/api/export-transactions/stats')
        ->assertOk()
        ->assertJsonPath('data.total', 1)
        ->assertJsonPath('data.pending', 1)
        ->assertJsonPath('data.completed', 0);
});

test('export transactions can be searched by vessel name', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    ExportTransaction::factory()->create([
        'vessel' => 'MV Explorer',
        'assigned_user_id' => $user->id,
    ]);
    ExportTransaction::factory()->create([
        'vessel' => 'MV Atlantic',
        'assigned_user_id' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->getJson('/api/export-transactions?search=Explorer');

    $response->assertOk();
    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['vessel'])->toBe('MV Explorer');
});

test('export transactions can be filtered by status', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    ExportTransaction::factory()->pending()->count(2)->create(['assigned_user_id' => $user->id]);
    ExportTransaction::factory()->completed()->create(['assigned_user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->getJson('/api/export-transactions?status=Pending');

    $response->assertOk();
    $data = $response->json('data');
    expect($data)->toHaveCount(2);
});

test('active export transactions can be fetched through the tracking detail endpoint', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $transaction = ExportTransaction::factory()->pending()->create([
        'assigned_user_id' => $user->id,
    ]);

    $referenceId = 'EXP-'.str_pad((string) $transaction->id, 4, '0', STR_PAD_LEFT);

    $this->actingAs($user)
        ->getJson("/api/tracking/{$referenceId}")
        ->assertOk()
        ->assertJsonPath('data.type', 'export')
        ->assertJsonPath('data.transaction.id', $transaction->id)
        ->assertJsonPath('data.transaction.bl_no', $transaction->bl_no);
});

test('completed export transactions are hidden from the tracking detail endpoint', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $transaction = ExportTransaction::factory()->completed()->create([
        'assigned_user_id' => $user->id,
    ]);

    $referenceId = 'EXP-'.str_pad((string) $transaction->id, 4, '0', STR_PAD_LEFT);

    $this->actingAs($user)
        ->getJson("/api/tracking/{$referenceId}")
        ->assertNotFound();
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
        ->assertJsonPath('data.status', 'Pending')
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
    expect($transaction->stages->docs_prep_status->value)->toBe('pending');
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
            'status' => 'Completed', // Attacker trying to skip workflow
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'Pending'); // Server always sets 'Pending'
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

// --- Update ---

test('assigned user can update their export transaction', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();
    $transaction = ExportTransaction::factory()->create(['assigned_user_id' => $user->id]);

    $payload = [
        'shipper_id' => $client->id,
        'bl_no' => 'BL-UPDATED-001',
        'vessel' => 'MV Updated Ship',
        'destination_country_id' => $country->id,
    ];

    $response = $this->actingAs($user)
        ->putJson("/api/export-transactions/{$transaction->id}", $payload);

    $response->assertOk()
        ->assertJsonPath('data.bl_no', 'BL-UPDATED-001')
        ->assertJsonPath('data.vessel', 'MV Updated Ship');

    $this->assertDatabaseHas('export_transactions', [
        'id' => $transaction->id,
        'bl_no' => 'BL-UPDATED-001',
        'vessel' => 'MV Updated Ship',
    ]);
});

test('other users cannot update an export transaction', function () {
    $owner = User::factory()->create(['role' => 'encoder']);
    $otherUser = User::factory()->create(['role' => 'encoder']);
    $transaction = ExportTransaction::factory()->create(['assigned_user_id' => $owner->id]);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $response = $this->actingAs($otherUser)
        ->putJson("/api/export-transactions/{$transaction->id}", [
            'shipper_id' => $client->id,
            'bl_no' => 'BL-UPDATED',
            'vessel' => 'MV Updated',
            'destination_country_id' => $country->id,
        ]);

    $response->assertForbidden();
});

test('admins can update any export transaction', function () {
    $owner = User::factory()->create(['role' => 'encoder']);
    $admin = User::factory()->create(['role' => 'admin']);
    $transaction = ExportTransaction::factory()->create(['assigned_user_id' => $owner->id]);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $response = $this->actingAs($admin)
        ->putJson("/api/export-transactions/{$transaction->id}", [
            'shipper_id' => $client->id,
            'bl_no' => 'BL-ADMIN-UPDATE',
            'vessel' => 'MV Admin',
            'destination_country_id' => $country->id,
        ]);

    $response->assertOk();
});

test('updating an export transaction ignores mass assignment of status', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $transaction = ExportTransaction::factory()->create(['assigned_user_id' => $user->id, 'status' => 'Pending']);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $response = $this->actingAs($user)
        ->putJson("/api/export-transactions/{$transaction->id}", [
            'shipper_id' => $client->id,
            'bl_no' => 'BL-UPDATED',
            'vessel' => 'MV Updated',
            'destination_country_id' => $country->id,
            'status' => 'Completed', // Attacker trying to skip workflow
        ]);

    $response->assertOk();

    // Status should remain unchanged by the update endpoint
    $this->assertDatabaseHas('export_transactions', [
        'id' => $transaction->id,
        'status' => 'Pending',
    ]);
});

test('can update using same bl_no (unique validation ignores self)', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $transaction = ExportTransaction::factory()->create(['assigned_user_id' => $user->id, 'bl_no' => 'BL-ORIGINAL']);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $response = $this->actingAs($user)
        ->putJson("/api/export-transactions/{$transaction->id}", [
            'shipper_id' => $client->id,
            'bl_no' => 'BL-ORIGINAL', // keeping it the same
            'vessel' => 'MV Updated',
            'destination_country_id' => $country->id,
        ]);

    $response->assertOk();
});

test('marking an optional export stage as not applicable does not advance the live status', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $transaction = ExportTransaction::factory()->create([
        'assigned_user_id' => $user->id,
        'status' => 'Pending',
    ]);

    $this->actingAs($user)
        ->patchJson("/api/export-transactions/{$transaction->id}/stage-applicability", [
            'stage' => 'co',
            'not_applicable' => true,
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'Pending')
        ->assertJsonPath('data.not_applicable_stages.0', 'co');

    $transaction->refresh()->load('stages');

    expect($transaction->status->value)->toBe('Pending');
    expect($transaction->stages->co_not_applicable)->toBeTrue();
});
