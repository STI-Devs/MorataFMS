<?php

use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
use App\Models\AuditLog;
use App\Models\ExportTransaction;
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

test('admin can filter and paginate transaction oversight results', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    ImportTransaction::factory()->count(2)->create([
        'status' => 'Pending',
        'is_archive' => false,
    ]);
    ImportTransaction::factory()->create([
        'status' => 'Completed',
        'is_archive' => true,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/transactions?type=import&per_page=1')
        ->assertOk();

    $response
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('imports_count', 2)
        ->assertJsonPath('exports_count', 0)
        ->assertJsonPath('total', 2)
        ->assertJsonPath('meta.per_page', 1)
        ->assertJsonPath('meta.total_records', 2)
        ->assertJsonPath('data.0.type', 'import');
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

test('overriding an import transaction to completed stamps the final stage timestamp', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $transaction = ImportTransaction::factory()->create([
        'status' => 'Processing',
    ]);

    expect($transaction->stages)->not->toBeNull();
    expect($transaction->stages->billing_completed_at)->toBeNull();

    $this->actingAs($admin)
        ->patchJson("/api/transactions/import/{$transaction->id}/status", [
            'status' => 'Completed',
        ])
        ->assertOk()
        ->assertJsonPath('status', 'Completed');

    $transaction->refresh()->load('stages');

    expect($transaction->stages->billing_status->value)->toBe('completed');
    expect($transaction->stages->billing_completed_at)->not->toBeNull();
    expect($transaction->stages->billing_completed_by)->toBe($admin->id);
});

test('overriding an export transaction to completed stamps the final stage timestamp', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $transaction = ExportTransaction::factory()->create([
        'status' => 'Processing',
    ]);

    expect($transaction->stages)->not->toBeNull();
    expect($transaction->stages->billing_completed_at)->toBeNull();

    $this->actingAs($admin)
        ->patchJson("/api/transactions/export/{$transaction->id}/status", [
            'status' => 'Completed',
        ])
        ->assertOk()
        ->assertJsonPath('status', 'Completed');

    $transaction->refresh()->load('stages');

    expect($transaction->stages->billing_status->value)->toBe('completed');
    expect($transaction->stages->billing_completed_at)->not->toBeNull();
    expect($transaction->stages->billing_completed_by)->toBe($admin->id);
});

test('admin can reassign a completed import transaction', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $originalEncoder = User::factory()->create(['role' => 'encoder']);
    $newEncoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create([
        'status' => ImportStatus::Completed,
        'assigned_user_id' => $originalEncoder->id,
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/transactions/import/{$transaction->id}/reassign", [
            'assigned_user_id' => $newEncoder->id,
        ])
        ->assertOk()
        ->assertJsonPath('assigned_user_id', $newEncoder->id);

    $this->assertDatabaseHas('import_transactions', [
        'id' => $transaction->id,
        'assigned_user_id' => $newEncoder->id,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'encoder_reassigned',
        'auditable_type' => 'App\Models\ImportTransaction',
        'auditable_id' => $transaction->id,
    ]);
});

test('admin can reassign a cancelled import transaction', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $originalEncoder = User::factory()->create(['role' => 'encoder']);
    $newEncoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create([
        'status' => ImportStatus::Cancelled,
        'assigned_user_id' => $originalEncoder->id,
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/transactions/import/{$transaction->id}/reassign", [
            'assigned_user_id' => $newEncoder->id,
        ])
        ->assertOk()
        ->assertJsonPath('assigned_user_id', $newEncoder->id);

    $this->assertDatabaseHas('import_transactions', [
        'id' => $transaction->id,
        'assigned_user_id' => $newEncoder->id,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'encoder_reassigned',
        'auditable_type' => 'App\Models\ImportTransaction',
        'auditable_id' => $transaction->id,
    ]);
});

test('admin can override status of a completed import transaction', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $transaction = ImportTransaction::factory()->create([
        'status' => ImportStatus::Completed,
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/transactions/import/{$transaction->id}/status", [
            'status' => ImportStatus::Pending->value,
        ])
        ->assertOk()
        ->assertJsonPath('status', ImportStatus::Pending->value);

    $this->assertDatabaseHas('import_transactions', [
        'id' => $transaction->id,
        'status' => ImportStatus::Pending->value,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'status_changed',
        'auditable_type' => 'App\Models\ImportTransaction',
        'auditable_id' => $transaction->id,
    ]);
});

test('admin can override status of a completed export transaction', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $transaction = ExportTransaction::factory()->create([
        'status' => ExportStatus::Completed,
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/transactions/export/{$transaction->id}/status", [
            'status' => ExportStatus::Pending->value,
        ])
        ->assertOk()
        ->assertJsonPath('status', ExportStatus::Pending->value);

    $this->assertDatabaseHas('export_transactions', [
        'id' => $transaction->id,
        'status' => ExportStatus::Pending->value,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'status_changed',
        'auditable_type' => 'App\Models\ExportTransaction',
        'auditable_id' => $transaction->id,
    ]);
});

test('admin can restore a cancelled import transaction', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $transaction = ImportTransaction::factory()->create([
        'status' => ImportStatus::Cancelled,
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/transactions/import/{$transaction->id}/status", [
            'status' => ImportStatus::Pending->value,
        ])
        ->assertOk()
        ->assertJsonPath('status', ImportStatus::Pending->value);

    $this->assertDatabaseHas('import_transactions', [
        'id' => $transaction->id,
        'status' => ImportStatus::Pending->value,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'status_changed',
        'auditable_type' => 'App\Models\ImportTransaction',
        'auditable_id' => $transaction->id,
    ]);
});

test('admin can restore a cancelled export transaction', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $transaction = ExportTransaction::factory()->create([
        'status' => ExportStatus::Cancelled,
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/transactions/export/{$transaction->id}/status", [
            'status' => ExportStatus::Pending->value,
        ])
        ->assertOk()
        ->assertJsonPath('status', ExportStatus::Pending->value);

    $this->assertDatabaseHas('export_transactions', [
        'id' => $transaction->id,
        'status' => ExportStatus::Pending->value,
    ]);

    $this->assertDatabaseHas('audit_logs', [
        'event' => 'status_changed',
        'auditable_type' => 'App\Models\ExportTransaction',
        'auditable_id' => $transaction->id,
    ]);
});
