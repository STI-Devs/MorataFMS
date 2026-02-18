<?php

use App\Models\AuditLog;
use App\Models\Client;
use App\Models\ImportTransaction;
use App\Models\User;

// --- Authentication & Authorization ---

test('unauthenticated users cannot access audit logs', function () {
    $this->getJson('/api/audit-logs')
        ->assertStatus(401);
});

test('encoder cannot access audit logs', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);

    $this->actingAs($encoder)
        ->getJson('/api/audit-logs')
        ->assertStatus(403);
});

test('broker cannot access audit logs', function () {
    $broker = User::factory()->create(['role' => 'broker']);

    $this->actingAs($broker)
        ->getJson('/api/audit-logs')
        ->assertStatus(403);
});

test('supervisor can access audit logs', function () {
    $supervisor = User::factory()->create(['role' => 'supervisor']);

    $this->actingAs($supervisor)
        ->getJson('/api/audit-logs')
        ->assertStatus(200);
});

test('admin can access audit logs', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->getJson('/api/audit-logs')
        ->assertStatus(200);
});

// --- Automatic Logging ---

test('creating an import transaction generates a created audit log', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    $this->actingAs($user)
        ->postJson('/api/import-transactions', [
            'customs_ref_no' => 'REF-AUDIT-001',
            'bl_no' => 'BL-AUDIT-001',
            'selective_color' => 'green',
            'importer_id' => $client->id,
            'arrival_date' => '2026-03-01',
        ])
        ->assertStatus(201);

    $log = AuditLog::where('auditable_type', 'App\Models\ImportTransaction')
        ->where('event', 'created')
        ->latest()
        ->first();

    expect($log)->not->toBeNull();
    expect($log->user_id)->toBe($user->id);
    expect($log->event)->toBe('created');
    expect($log->new_values)->toHaveKey('customs_ref_no', 'REF-AUDIT-001');
});

test('cancelling a transaction generates an updated audit log with old and new status', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    // Create transaction
    $this->actingAs($user)
        ->postJson('/api/import-transactions', [
            'customs_ref_no' => 'REF-CANCEL-001',
            'bl_no' => 'BL-CANCEL-001',
            'selective_color' => 'green',
            'importer_id' => $client->id,
            'arrival_date' => '2026-03-01',
        ]);

    $transaction = ImportTransaction::where('customs_ref_no', 'REF-CANCEL-001')->first();

    // Cancel it
    $this->actingAs($user)
        ->patchJson("/api/import-transactions/{$transaction->id}/cancel", [
            'reason' => 'Test cancellation',
        ]);

    $log = AuditLog::where('auditable_type', 'App\Models\ImportTransaction')
        ->where('event', 'updated')
        ->latest()
        ->first();

    expect($log)->not->toBeNull();
    expect($log->old_values)->toHaveKey('status', 'pending');
    expect($log->new_values)->toHaveKey('status', 'cancelled');
});

test('deleting a transaction generates a deleted audit log', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->importer()->create();

    $this->actingAs($user)
        ->postJson('/api/import-transactions', [
            'customs_ref_no' => 'REF-DELETE-001',
            'bl_no' => 'BL-DELETE-001',
            'selective_color' => 'green',
            'importer_id' => $client->id,
            'arrival_date' => '2026-03-01',
        ]);

    $transaction = ImportTransaction::where('customs_ref_no', 'REF-DELETE-001')->first();

    $this->actingAs($user)
        ->deleteJson("/api/import-transactions/{$transaction->id}");

    $log = AuditLog::where('auditable_type', 'App\Models\ImportTransaction')
        ->where('event', 'deleted')
        ->latest()
        ->first();

    expect($log)->not->toBeNull();
    expect($log->old_values)->toHaveKey('customs_ref_no', 'REF-DELETE-001');
});

// --- Security: Password Exclusion ---

test('password changes are never logged in audit trail', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $targetUser = User::factory()->create(['role' => 'encoder']);

    $this->actingAs($admin)
        ->putJson("/api/users/{$targetUser->id}", [
            'name' => 'Updated Name',
            'password' => 'new-password-123',
        ]);

    $logs = AuditLog::where('auditable_type', 'App\Models\User')
        ->where('auditable_id', $targetUser->id)
        ->where('event', 'updated')
        ->get();

    foreach ($logs as $log) {
        expect($log->old_values)->not->toHaveKey('password');
        expect($log->new_values)->not->toHaveKey('password');
        expect($log->old_values)->not->toHaveKey('remember_token');
        expect($log->new_values)->not->toHaveKey('remember_token');
    }
});

// --- Filtering ---

test('audit logs can be filtered by auditable type', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->importer()->create();

    // Create an import transaction (generates audit log)
    $this->actingAs($admin)
        ->postJson('/api/import-transactions', [
            'customs_ref_no' => 'REF-FILTER-001',
            'bl_no' => 'BL-FILTER-001',
            'selective_color' => 'green',
            'importer_id' => $client->id,
            'arrival_date' => '2026-03-01',
        ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/audit-logs?auditable_type=ImportTransaction');

    $response->assertStatus(200);

    $data = $response->json('data');
    foreach ($data as $log) {
        expect($log['auditable_type'])->toBe('Import Transaction');
    }
});

test('audit logs can be filtered by event type', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->importer()->create();

    // Create a transaction (generates 'created' log)
    $this->actingAs($admin)
        ->postJson('/api/import-transactions', [
            'customs_ref_no' => 'REF-EVENT-001',
            'bl_no' => 'BL-EVENT-001',
            'selective_color' => 'green',
            'importer_id' => $client->id,
            'arrival_date' => '2026-03-01',
        ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/audit-logs?event=created');

    $response->assertStatus(200);

    $data = $response->json('data');
    foreach ($data as $log) {
        expect($log['event'])->toBe('created');
    }
});

test('audit logs include user information', function () {
    $admin = User::factory()->create(['role' => 'admin', 'name' => 'Test Admin']);
    $client = Client::factory()->importer()->create();

    $this->actingAs($admin)
        ->postJson('/api/import-transactions', [
            'customs_ref_no' => 'REF-USER-001',
            'bl_no' => 'BL-USER-001',
            'selective_color' => 'green',
            'importer_id' => $client->id,
            'arrival_date' => '2026-03-01',
        ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/audit-logs');

    $response->assertStatus(200);
    $response->assertJsonStructure([
        'data' => [
            '*' => ['id', 'event', 'auditable_type', 'auditable_id', 'user', 'old_values', 'new_values', 'created_at'],
        ],
    ]);
});
