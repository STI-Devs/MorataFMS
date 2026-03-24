<?php

use App\Models\Client;
use App\Models\Country;
use App\Models\ImportTransaction;
use App\Models\User;

// --- Authentication Guard ---

test('unauthenticated users cannot list import transactions', function () {
    $this->getJson('/api/import-transactions')
        ->assertUnauthorized();
});

test('unauthenticated users cannot create import transactions', function () {
    $this->postJson('/api/import-transactions', [])
        ->assertUnauthorized();
});

// --- Index (List) ---

test('admin can list import transactions', function () {
    $user = User::factory()->create(['role' => 'admin']);
    ImportTransaction::factory()->count(3)->create();

    $response = $this->actingAs($user)
        ->getJson('/api/import-transactions');

    $response->assertOk()
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'customs_ref_no', 'bl_no', 'selective_color', 'importer', 'arrival_date', 'status'],
            ],
        ]);
});

test('encoders can only list their own import transactions', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);

    $ownedTransaction = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);
    ImportTransaction::factory()->create(['assigned_user_id' => $otherEncoder->id]);

    $response = $this->actingAs($encoder)
        ->getJson('/api/import-transactions');

    $response->assertOk()
        ->assertJsonPath('meta.total', 1);

    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['id'])->toBe($ownedTransaction->id);
});

test('import stats are scoped to the authenticated encoder', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);

    ImportTransaction::factory()->pending()->create(['assigned_user_id' => $encoder->id]);
    ImportTransaction::factory()->completed()->create(['assigned_user_id' => $otherEncoder->id]);

    $this->actingAs($encoder)
        ->getJson('/api/import-transactions/stats')
        ->assertOk()
        ->assertJsonPath('data.total', 1)
        ->assertJsonPath('data.pending', 1)
        ->assertJsonPath('data.completed', 0);
});

test('import transactions can be searched by customs ref', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $target = ImportTransaction::factory()->create([
        'customs_ref_no' => 'REF-SEARCH-001',
        'assigned_user_id' => $user->id,
    ]);
    ImportTransaction::factory()->create([
        'customs_ref_no' => 'REF-OTHER-999',
        'assigned_user_id' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->getJson('/api/import-transactions?search=SEARCH-001');

    $response->assertOk();
    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['customs_ref_no'])->toBe('REF-SEARCH-001');
});

test('import transactions can be filtered by status', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    ImportTransaction::factory()->pending()->count(2)->create(['assigned_user_id' => $user->id]);
    ImportTransaction::factory()->completed()->create(['assigned_user_id' => $user->id]);

    $response = $this->actingAs($user)
        ->getJson('/api/import-transactions?status=Pending');

    $response->assertOk();
    $data = $response->json('data');
    expect($data)->toHaveCount(2);
});

test('active import transactions can be fetched through the tracking detail endpoint', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->pending()->create([
        'customs_ref_no' => 'TRACK-IMP-001',
        'assigned_user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->getJson('/api/tracking/TRACK-IMP-001')
        ->assertOk()
        ->assertJsonPath('data.type', 'import')
        ->assertJsonPath('data.transaction.id', $transaction->id)
        ->assertJsonPath('data.transaction.customs_ref_no', 'TRACK-IMP-001');
});

test('completed import transactions are hidden from the tracking detail endpoint', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    ImportTransaction::factory()->completed()->create([
        'customs_ref_no' => 'TRACK-IMP-DONE',
        'assigned_user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->getJson('/api/tracking/TRACK-IMP-DONE')
        ->assertNotFound();
});

// --- Store (Create) ---

test('authenticated users can create import transactions with valid data', function () {
    $user = User::factory()->create();
    $client = Client::factory()->importer()->create();
    $country = Country::factory()->importOrigin()->create();

    $payload = [
        'customs_ref_no' => 'REF-2026-001',
        'bl_no' => 'BL-12345678',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'origin_country_id' => $country->id,
        'arrival_date' => '2025-06-15',
    ];

    $response = $this->actingAs($user)
        ->postJson('/api/import-transactions', $payload);

    $response->assertCreated()
        ->assertJsonPath('data.customs_ref_no', 'REF-2026-001')
        ->assertJsonPath('data.bl_no', 'BL-12345678')
        ->assertJsonPath('data.selective_color', 'green')
        ->assertJsonPath('data.status', 'Pending')
        ->assertJsonPath('data.importer.id', $client->id)
        ->assertJsonPath('data.importer.name', $client->name)
        ->assertJsonPath('data.origin_country.id', $country->id)
        ->assertJsonPath('data.origin_country.name', $country->name);

    $this->assertDatabaseHas('import_transactions', [
        'customs_ref_no' => 'REF-2026-001',
        'bl_no' => 'BL-12345678',
        'assigned_user_id' => $user->id,
        'origin_country_id' => $country->id,
    ]);
});

test('authenticated users can create import transactions without origin country', function () {
    $user = User::factory()->create();
    $client = Client::factory()->importer()->create();

    $response = $this->actingAs($user)
        ->postJson('/api/import-transactions', [
            'customs_ref_no' => 'REF-2026-002',
            'bl_no' => 'BL-87654321',
            'selective_color' => 'yellow',
            'importer_id' => $client->id,
            'arrival_date' => '2025-06-15',
            // origin_country_id intentionally omitted — it's optional
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'Pending');
});

test('creating an import transaction auto-creates stages', function () {
    $user = User::factory()->create();
    $client = Client::factory()->importer()->create();

    $this->actingAs($user)->postJson('/api/import-transactions', [
        'customs_ref_no' => 'REF-STAGE-001',
        'bl_no' => 'BL-STAGE-001',
        'selective_color' => 'yellow',
        'importer_id' => $client->id,
        'arrival_date' => '2025-06-15',
    ]);

    $transaction = ImportTransaction::where('customs_ref_no', 'REF-STAGE-001')->first();
    expect($transaction)->not->toBeNull();
    expect($transaction->stages)->not->toBeNull();
    expect($transaction->stages->boc_status->value)->toBe('pending');
});

// --- Validation ---

test('creating import transaction fails without required fields', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->postJson('/api/import-transactions', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors([
            'customs_ref_no',
            'bl_no',
            'selective_color',
            'importer_id',
            'arrival_date',
        ]);
});

test('creating import transaction fails with invalid selective color', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create();

    $response = $this->actingAs($user)
        ->postJson('/api/import-transactions', [
            'customs_ref_no' => 'REF-001',
            'bl_no' => 'BL-001',
            'selective_color' => 'purple',
            'importer_id' => $client->id,
            'arrival_date' => '2025-06-15',
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['selective_color']);
});

test('creating import transaction fails with non-existent importer', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->postJson('/api/import-transactions', [
            'customs_ref_no' => 'REF-001',
            'bl_no' => 'BL-001',
            'selective_color' => 'green',
            'importer_id' => 99999,
            'arrival_date' => '2025-06-15',
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['importer_id']);
});

test('creating import transaction fails with non-existent origin country', function () {
    $user = User::factory()->create();
    $client = Client::factory()->importer()->create();

    $response = $this->actingAs($user)
        ->postJson('/api/import-transactions', [
            'customs_ref_no' => 'REF-001',
            'bl_no' => 'BL-001',
            'selective_color' => 'green',
            'importer_id' => $client->id,
            'origin_country_id' => 99999,
            'arrival_date' => '2025-06-15',
        ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['origin_country_id']);
});

// --- Security: Mass Assignment Protection ---

test('mass assignment of status is ignored on create', function () {
    $user = User::factory()->create();
    $client = Client::factory()->importer()->create();

    $response = $this->actingAs($user)
        ->postJson('/api/import-transactions', [
            'customs_ref_no' => 'REF-HACK-001',
            'bl_no' => 'BL-HACK-001',
            'selective_color' => 'green',
            'importer_id' => $client->id,
            'arrival_date' => '2025-06-15',
            'status' => 'Completed', // Attacker trying to skip workflow
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.status', 'Pending'); // Server always sets 'pending'
});

test('mass assignment of assigned_user_id is ignored on create', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $client = Client::factory()->importer()->create();

    $response = $this->actingAs($user)
        ->postJson('/api/import-transactions', [
            'customs_ref_no' => 'REF-HACK-002',
            'bl_no' => 'BL-HACK-002',
            'selective_color' => 'green',
            'importer_id' => $client->id,
            'arrival_date' => '2025-06-15',
            'assigned_user_id' => $otherUser->id, // Attacker trying to assign to someone else
        ]);

    $response->assertCreated();

    $transaction = ImportTransaction::where('customs_ref_no', 'REF-HACK-002')->first();
    expect($transaction->assigned_user_id)->toBe($user->id); // Server uses authenticated user
});

// --- Update ---

test('assigned user can update their import transaction', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();
    $country = Country::factory()->importOrigin()->create();
    $transaction = ImportTransaction::factory()->create([
        'assigned_user_id' => $user->id,
        'selective_color' => 'yellow',
    ]);

    $payload = [
        'customs_ref_no' => 'REF-UPDATED-001',
        'bl_no' => 'BL-UPDATED-001',
        'selective_color' => 'red',
        'importer_id' => $client->id,
        'origin_country_id' => $country->id,
        'arrival_date' => '2025-06-20',
    ];

    $response = $this->actingAs($user)
        ->putJson("/api/import-transactions/{$transaction->id}", $payload);

    $response->assertOk()
        ->assertJsonPath('data.customs_ref_no', 'REF-UPDATED-001')
        ->assertJsonPath('data.selective_color', 'yellow');

    $this->assertDatabaseHas('import_transactions', [
        'id' => $transaction->id,
        'customs_ref_no' => 'REF-UPDATED-001',
        'selective_color' => 'yellow',
    ]);
});

test('other users cannot update an import transaction', function () {
    $owner = User::factory()->create(['role' => 'encoder']);
    $otherUser = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create(['assigned_user_id' => $owner->id]);
    $client = Client::factory()->importer()->create();

    $response = $this->actingAs($otherUser)
        ->putJson("/api/import-transactions/{$transaction->id}", [
            'customs_ref_no' => 'REF-UPDATED',
            'bl_no' => 'BL-UPDATED',
            'selective_color' => 'red',
            'importer_id' => $client->id,
            'arrival_date' => '2025-06-20',
        ]);

    $response->assertForbidden();
});

test('admins can update any import transaction', function () {
    $owner = User::factory()->create(['role' => 'encoder']);
    $admin = User::factory()->create(['role' => 'admin']);
    $transaction = ImportTransaction::factory()->create(['assigned_user_id' => $owner->id]);
    $client = Client::factory()->importer()->create();

    $response = $this->actingAs($admin)
        ->putJson("/api/import-transactions/{$transaction->id}", [
            'customs_ref_no' => 'REF-ADMIN-UPDATE',
            'bl_no' => 'BL-UPDATED',
            'selective_color' => 'red',
            'importer_id' => $client->id,
            'arrival_date' => '2025-06-20',
        ]);

    $response->assertOk();
});

test('updating an import transaction ignores mass assignment of status', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create(['assigned_user_id' => $user->id, 'status' => 'Pending']);
    $client = Client::factory()->importer()->create();

    $response = $this->actingAs($user)
        ->putJson("/api/import-transactions/{$transaction->id}", [
            'customs_ref_no' => 'REF-UPDATED',
            'bl_no' => 'BL-UPDATED',
            'selective_color' => 'red',
            'importer_id' => $client->id,
            'arrival_date' => '2025-06-20',
            'status' => 'Completed', // Attacker trying to skip workflow
        ]);

    $response->assertOk();

    // Status should remain unchanged by the update endpoint
    $this->assertDatabaseHas('import_transactions', [
        'id' => $transaction->id,
        'status' => 'Pending',
    ]);
});

test('can update using same bl_no (unique validation ignores self)', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create(['assigned_user_id' => $user->id, 'bl_no' => 'BL-ORIGINAL']);
    $client = Client::factory()->importer()->create();

    $response = $this->actingAs($user)
        ->putJson("/api/import-transactions/{$transaction->id}", [
            'customs_ref_no' => 'REF-UPDATED',
            'bl_no' => 'BL-ORIGINAL', // keeping it the same
            'selective_color' => 'red',
            'importer_id' => $client->id,
            'arrival_date' => '2025-06-20',
        ]);

    $response->assertOk();
});
