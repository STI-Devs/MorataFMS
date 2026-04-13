<?php

use App\Enums\AuditEvent;
use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;
use Carbon\CarbonImmutable;

beforeEach(function () {
    CarbonImmutable::setTestNow('2026-03-29 12:00:00');
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

test('admin dashboard returns aggregated oversight data', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'name' => 'Admin User',
    ]);

    $sarah = User::factory()->create([
        'role' => 'encoder',
        'name' => 'Sarah Velasco',
        'job_title' => 'Senior Encoder',
    ]);

    $mike = User::factory()->create([
        'role' => 'encoder',
        'name' => 'Mike Tan',
        'job_title' => 'Encoder',
    ]);

    $staleImport = ImportTransaction::factory()->create([
        'customs_ref_no' => 'IMP-0921',
        'status' => ImportStatus::Processing,
        'assigned_user_id' => $sarah->id,
        'is_archive' => false,
        'created_at' => now()->subDays(5),
        'updated_at' => now()->subDays(3),
    ]);

    $activeExport = ExportTransaction::factory()->create([
        'status' => ExportStatus::Processing,
        'assigned_user_id' => $mike->id,
        'is_archive' => false,
        'created_at' => now()->subDays(2),
        'updated_at' => now()->subHours(4),
    ]);

    $missingDocsImport = ImportTransaction::factory()->create([
        'customs_ref_no' => 'IMP-1001',
        'status' => ImportStatus::Completed,
        'assigned_user_id' => $sarah->id,
        'is_archive' => false,
        'updated_at' => now()->subHours(6),
    ]);

    $flaggedExport = ExportTransaction::factory()->create([
        'status' => ExportStatus::Cancelled,
        'assigned_user_id' => $mike->id,
        'is_archive' => false,
        'updated_at' => now()->subMinutes(30),
    ]);

    foreach (['boc', 'bl_generation', 'co', 'phytosanitary', 'dccci', 'billing'] as $typeKey) {
        Document::factory()->create([
            'documentable_type' => ExportTransaction::class,
            'documentable_id' => $flaggedExport->id,
            'type' => $typeKey,
            'uploaded_by' => $admin->id,
        ]);
    }

    TransactionRemark::factory()->create([
        'remarkble_type' => ExportTransaction::class,
        'remarkble_id' => $flaggedExport->id,
        'author_id' => $admin->id,
        'message' => 'Carrier amendment still unresolved.',
        'is_resolved' => false,
        'created_at' => now()->subMinutes(30),
        'updated_at' => now()->subMinutes(30),
    ]);

    AuditLog::query()->create([
        'auditable_type' => ImportTransaction::class,
        'auditable_id' => $staleImport->id,
        'user_id' => $admin->id,
        'event' => AuditEvent::EncoderReassigned->value,
        'new_values' => [
            'description' => 'Admin User reassigned import #'.$staleImport->id.' from Mike Tan to Sarah Velasco.',
        ],
        'ip_address' => '127.0.0.1',
        'created_at' => now()->subHour(),
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/admin/dashboard')
        ->assertOk();

    $workloads = collect($response->json('workloads'))->keyBy('name');
    $actionFeed = collect($response->json('action_feed'));

    $response
        ->assertJsonPath('kpis.active_imports', 1)
        ->assertJsonPath('kpis.active_exports', 1)
        ->assertJsonPath('kpis.delayed_shipments', 1)
        ->assertJsonPath('kpis.missing_final_docs', 1)
        ->assertJsonPath('critical_operations.0.status', 'review')
        ->assertJsonPath('critical_operations.0.ref', 'EXP-'.str_pad((string) $flaggedExport->id, 4, '0', STR_PAD_LEFT))
        ->assertJsonPath('critical_operations.1.status', 'missing')
        ->assertJsonPath('critical_operations.1.ref', 'IMP-1001')
        ->assertJsonPath('critical_operations.2.status', 'stuck')
        ->assertJsonPath('critical_operations.2.ref', 'IMP-0921');

    expect($actionFeed->contains(fn (array $item): bool => $item['action'] === 'Document Alert'
        && $item['target'] === 'EXP-'.str_pad((string) $flaggedExport->id, 4, '0', STR_PAD_LEFT)))
        ->toBeTrue();

    expect($actionFeed->contains(fn (array $item): bool => $item['action'] === 'Encoder Reassigned'
        && $item['target'] === 'IMP-0921'))
        ->toBeTrue();

    expect($workloads->get('Sarah Velasco'))->toMatchArray([
        'role' => 'Senior Encoder',
        'active' => 1,
        'overdue' => 1,
    ]);

    expect($workloads->get('Mike Tan'))->toMatchArray([
        'active' => 1,
        'overdue' => 0,
    ]);
});

test('non admins cannot access the admin dashboard endpoint', function () {
    $encoder = User::factory()->create([
        'role' => 'encoder',
    ]);

    $this->actingAs($encoder)
        ->getJson('/api/admin/dashboard')
        ->assertForbidden();
});
