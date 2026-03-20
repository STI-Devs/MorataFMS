<?php

use App\Models\AuditLog;
use App\Models\ImportTransaction;
use App\Models\User;

test('admin can access the transaction oversight dashboard', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    ImportTransaction::factory()->count(2)->create();

    $this->actingAs($admin)
        ->getJson('/api/transactions')
        ->assertOk()
        ->assertJsonStructure([
            'data',
            'total',
            'imports_count',
            'exports_count',
        ]);
});

test('non admins cannot access the transaction oversight dashboard', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);

    $this->actingAs($encoder)
        ->getJson('/api/transactions')
        ->assertForbidden();
});

test('admin can reassign an import transaction', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $currentAssignee = User::factory()->create(['role' => 'encoder']);
    $newAssignee = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create([
        'assigned_user_id' => $currentAssignee->id,
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/transactions/import/{$transaction->id}/reassign", [
            'assigned_user_id' => $newAssignee->id,
        ])
        ->assertOk()
        ->assertJsonPath('assigned_user_id', $newAssignee->id);

    $this->assertDatabaseHas('import_transactions', [
        'id' => $transaction->id,
        'assigned_user_id' => $newAssignee->id,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'encoder_reassigned',
        'auditable_type' => 'App\Models\ImportTransaction',
        'auditable_id' => $transaction->id,
    ]);
});

test('admin can override an import transaction status using the canonical status value', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $transaction = ImportTransaction::factory()->create([
        'status' => 'Pending',
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/transactions/import/{$transaction->id}/status", [
            'status' => 'Vessel Arrived',
        ])
        ->assertOk()
        ->assertJsonPath('status', 'Vessel Arrived');

    $transaction->refresh();

    expect($transaction->status->value)->toBe('Vessel Arrived');

    $log = AuditLog::where('event', 'status_changed')
        ->where('auditable_type', 'App\Models\ImportTransaction')
        ->where('auditable_id', $transaction->id)
        ->latest()
        ->first();

    expect($log)->not->toBeNull();
});
