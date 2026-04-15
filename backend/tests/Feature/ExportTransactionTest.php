<?php

use App\Models\Client;
use App\Models\Country;
use App\Models\ExportTransaction;
use App\Models\User;
use Illuminate\Support\Carbon;

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

test('processors list shared exports with ready cil tasks', function () {
    $processor = User::factory()->create(['role' => 'processor']);
    $encoder = User::factory()->create(['role' => 'encoder']);

    $visibleTransaction = ExportTransaction::factory()->pending()->create(['assigned_user_id' => $encoder->id]);
    $visibleTransaction->stages()->update([
        'docs_prep_status' => 'completed',
        'bl_status' => 'completed',
        'phytosanitary_status' => 'completed',
        'co_status' => 'completed',
        'cil_status' => 'pending',
        'dccci_status' => 'pending',
        'billing_status' => 'pending',
    ]);

    $hiddenTransaction = ExportTransaction::factory()->pending()->create(['assigned_user_id' => $encoder->id]);
    $hiddenTransaction->stages()->update([
        'docs_prep_status' => 'completed',
        'bl_status' => 'pending',
        'phytosanitary_status' => 'pending',
        'co_status' => 'pending',
        'cil_status' => 'pending',
        'dccci_status' => 'pending',
        'billing_status' => 'pending',
    ]);

    $response = $this->actingAs($processor)
        ->getJson('/api/export-transactions');

    $response->assertOk()
        ->assertJsonPath('meta.total', 1);

    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['id'])->toBe($visibleTransaction->id);
});

test('accounting users list shared exports only when billing is ready', function () {
    $accountant = User::factory()->create(['role' => 'accounting']);
    $encoder = User::factory()->create(['role' => 'encoder']);

    $visibleTransaction = ExportTransaction::factory()->pending()->create(['assigned_user_id' => $encoder->id]);
    $visibleTransaction->stages()->update([
        'docs_prep_status' => 'completed',
        'bl_status' => 'completed',
        'phytosanitary_status' => 'completed',
        'co_status' => 'completed',
        'cil_status' => 'completed',
        'dccci_status' => 'completed',
        'billing_status' => 'pending',
    ]);

    $hiddenTransaction = ExportTransaction::factory()->pending()->create(['assigned_user_id' => $encoder->id]);
    $hiddenTransaction->stages()->update([
        'docs_prep_status' => 'completed',
        'bl_status' => 'completed',
        'phytosanitary_status' => 'completed',
        'co_status' => 'completed',
        'cil_status' => 'pending',
        'dccci_status' => 'pending',
        'billing_status' => 'pending',
    ]);

    $response = $this->actingAs($accountant)
        ->getJson('/api/export-transactions');

    $response->assertOk()
        ->assertJsonPath('meta.total', 1);

    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['id'])->toBe($visibleTransaction->id);
});

test('processors can list waiting exports when requesting the operational workspace view', function () {
    $processor = User::factory()->create(['role' => 'processor']);
    $encoder = User::factory()->create(['role' => 'encoder']);

    $waitingSince = Carbon::parse('2026-04-13 09:00:00', 'UTC');
    $waitingTransaction = ExportTransaction::factory()->pending()->create([
        'assigned_user_id' => $encoder->id,
        'created_at' => '2026-04-09 00:00:00',
        'updated_at' => '2026-04-09 00:00:00',
    ]);
    $waitingTransaction->stages()->update([
        'docs_prep_status' => 'completed',
        'docs_prep_completed_at' => $waitingSince,
        'bl_status' => 'pending',
        'phytosanitary_status' => 'pending',
        'co_status' => 'pending',
        'cil_status' => 'pending',
        'dccci_status' => 'pending',
    ]);

    $response = $this->actingAs($processor)
        ->getJson('/api/export-transactions?operational_scope=workspace');

    $response->assertOk()
        ->assertJsonPath('meta.total', 1);

    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['id'])->toBe($waitingTransaction->id);
    expect($data[0]['waiting_since'])->toBe($waitingSince->toISOString());
});

test('accounting can list waiting exports when requesting the operational workspace view', function () {
    $accountant = User::factory()->create(['role' => 'accounting']);
    $encoder = User::factory()->create(['role' => 'encoder']);

    $waitingSince = Carbon::parse('2026-04-13 15:45:00', 'UTC');
    $waitingTransaction = ExportTransaction::factory()->pending()->create([
        'assigned_user_id' => $encoder->id,
        'created_at' => '2026-04-08 00:00:00',
        'updated_at' => '2026-04-08 00:00:00',
    ]);
    $waitingTransaction->stages()->update([
        'docs_prep_status' => 'completed',
        'docs_prep_completed_at' => '2026-04-09 08:00:00',
        'bl_status' => 'completed',
        'bl_completed_at' => '2026-04-10 08:00:00',
        'phytosanitary_status' => 'completed',
        'phytosanitary_completed_at' => '2026-04-11 08:00:00',
        'co_status' => 'completed',
        'co_completed_at' => $waitingSince,
        'cil_status' => 'pending',
        'dccci_status' => 'pending',
        'billing_status' => 'pending',
    ]);

    $response = $this->actingAs($accountant)
        ->getJson('/api/export-transactions?operational_scope=workspace');

    $response->assertOk()
        ->assertJsonPath('meta.total', 1);

    $data = $response->json('data');
    expect($data)->toHaveCount(1);
    expect($data[0]['id'])->toBe($waitingTransaction->id);
    expect($data[0]['waiting_since'])->toBe($waitingSince->toISOString());
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

test('active export transactions can be fetched through the tracking detail endpoint by bill of lading', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $transaction = ExportTransaction::factory()->pending()->create([
        'assigned_user_id' => $user->id,
        'bl_no' => 'BL-TRACK-EXP-001',
    ]);

    $this->actingAs($user)
        ->getJson('/api/tracking/BL-TRACK-EXP-001')
        ->assertOk()
        ->assertJsonPath('data.type', 'export')
        ->assertJsonPath('data.transaction.id', $transaction->id)
        ->assertJsonPath('data.transaction.bl_no', 'BL-TRACK-EXP-001');
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
        'export_date' => '2026-04-14',
        'destination_country_id' => $country->id,
    ];

    $response = $this->actingAs($user)
        ->postJson('/api/export-transactions', $payload);

    $response->assertCreated()
        ->assertJsonPath('data.bl_no', 'BL-EXP-12345')
        ->assertJsonPath('data.vessel', 'MV Pacific Star')
        ->assertJsonPath('data.export_date', '2026-04-14')
        ->assertJsonPath('data.status', 'Pending')
        ->assertJsonPath('data.shipper.id', $client->id)
        ->assertJsonPath('data.shipper.name', $client->name);

    $this->assertDatabaseHas('export_transactions', [
        'bl_no' => 'BL-EXP-12345',
        'vessel' => 'MV Pacific Star',
        'export_date' => '2026-04-14 00:00:00',
        'assigned_user_id' => $user->id,
    ]);
});

test('operational roles cannot create export transactions', function (string $role) {
    $user = User::factory()->create(['role' => $role]);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $this->actingAs($user)
        ->postJson('/api/export-transactions', [
            'shipper_id' => $client->id,
            'bl_no' => 'BL-OPERATIONS-EXPORT-001',
            'vessel' => 'MV Operations',
            'export_date' => '2026-04-14',
            'destination_country_id' => $country->id,
        ])
        ->assertForbidden();
})->with(['processor', 'accounting']);

test('creating an export transaction auto-creates stages', function () {
    $user = User::factory()->create();
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $this->actingAs($user)->postJson('/api/export-transactions', [
        'shipper_id' => $client->id,
        'bl_no' => 'BL-STAGE-EXP-001',
        'vessel' => 'MV Stage Test',
        'export_date' => '2026-04-14',
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
            'export_date',
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
            'export_date' => '2026-04-14',
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
            'export_date' => '2026-04-14',
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
            'export_date' => '2026-04-14',
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
        'export_date' => '2026-04-15',
        'destination_country_id' => $country->id,
    ];

    $response = $this->actingAs($user)
        ->putJson("/api/export-transactions/{$transaction->id}", $payload);

    $response->assertOk()
        ->assertJsonPath('data.bl_no', 'BL-UPDATED-001')
        ->assertJsonPath('data.vessel', 'MV Updated Ship')
        ->assertJsonPath('data.export_date', '2026-04-15');

    $this->assertDatabaseHas('export_transactions', [
        'id' => $transaction->id,
        'bl_no' => 'BL-UPDATED-001',
        'vessel' => 'MV Updated Ship',
        'export_date' => '2026-04-15 00:00:00',
    ]);
});

test('operational roles cannot update assigned export transactions', function (string $role) {
    $user = User::factory()->create(['role' => $role]);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();
    $transaction = ExportTransaction::factory()->create(['assigned_user_id' => $user->id]);

    $this->actingAs($user)
        ->putJson("/api/export-transactions/{$transaction->id}", [
            'shipper_id' => $client->id,
            'bl_no' => 'BL-OPERATIONS-UPDATED',
            'vessel' => 'MV Restricted',
            'export_date' => '2026-04-15',
            'destination_country_id' => $country->id,
        ])
        ->assertForbidden();
})->with(['processor', 'accounting']);

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
            'export_date' => '2026-04-15',
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
            'export_date' => '2026-04-15',
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
            'export_date' => '2026-04-15',
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
            'export_date' => '2026-04-15',
            'destination_country_id' => $country->id,
        ]);

    $response->assertOk();
});

test('marking an optional export stage as not applicable does not advance the live status', function (string $stage, string $flagColumn) {
    $user = User::factory()->create(['role' => 'encoder']);
    $transaction = ExportTransaction::factory()->create([
        'assigned_user_id' => $user->id,
        'status' => 'Pending',
    ]);
    $transaction->stages()->update(match ($stage) {
        'co' => [
            'docs_prep_status' => 'completed',
            'docs_prep_completed_at' => now()->subHours(3),
            'bl_status' => 'completed',
            'bl_completed_at' => now()->subHours(2),
            'phytosanitary_status' => 'completed',
            'phytosanitary_completed_at' => now()->subHour(),
        ],
        'dccci' => [
            'docs_prep_status' => 'completed',
            'docs_prep_completed_at' => now()->subHours(5),
            'bl_status' => 'completed',
            'bl_completed_at' => now()->subHours(4),
            'phytosanitary_status' => 'completed',
            'phytosanitary_completed_at' => now()->subHours(3),
            'co_status' => 'completed',
            'co_completed_at' => now()->subHours(2),
            'cil_status' => 'completed',
            'cil_completed_at' => now()->subHour(),
        ],
    });

    $this->actingAs($user)
        ->patchJson("/api/export-transactions/{$transaction->id}/stage-applicability", [
            'stage' => $stage,
            'not_applicable' => true,
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'Pending')
        ->assertJsonFragment(['not_applicable_stages' => [$stage]]);

    $transaction->refresh()->load('stages');

    expect($transaction->status->value)->toBe('Pending');
    expect($transaction->stages->{$flagColumn})->toBeTrue();
})->with([
    'co application' => ['co', 'co_not_applicable'],
    'dccci printing' => ['dccci', 'dccci_not_applicable'],
]);

test('cannot mark an optional export stage as not applicable before earlier stages are completed', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $transaction = ExportTransaction::factory()->create([
        'assigned_user_id' => $user->id,
        'status' => 'Pending',
    ]);

    $this->actingAs($user)
        ->patchJson("/api/export-transactions/{$transaction->id}/stage-applicability", [
            'stage' => 'dccci',
            'not_applicable' => true,
        ])
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Complete the earlier required stages before marking this stage as not applicable.');

    $transaction->refresh()->load('stages');

    expect($transaction->stages->dccci_not_applicable)->toBeFalse();
});
