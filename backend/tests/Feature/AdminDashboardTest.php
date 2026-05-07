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
        'arrival_date' => now()->addDays(2),
        'created_at' => now()->subDays(5),
        'updated_at' => now()->subHours(60),
    ]);

    $activeExport = ExportTransaction::factory()->create([
        'status' => ExportStatus::Processing,
        'assigned_user_id' => $mike->id,
        'is_archive' => false,
        'export_date' => now()->addDays(4),
        'created_at' => now()->subDays(2),
        'updated_at' => now()->subHours(80),
    ]);

    $missingDocsImport = ImportTransaction::factory()->create([
        'customs_ref_no' => 'IMP-1001',
        'status' => ImportStatus::Completed,
        'assigned_user_id' => $sarah->id,
        'is_archive' => false,
        'created_at' => now()->subDays(2),
        'updated_at' => now()->subHours(6),
    ]);

    $flaggedExport = ExportTransaction::factory()->create([
        'bl_no' => 'BL-EXP-FLAG-001',
        'status' => ExportStatus::Cancelled,
        'assigned_user_id' => $mike->id,
        'is_archive' => false,
        'updated_at' => now()->subMinutes(30),
    ]);

    $completedExport = ExportTransaction::factory()->create([
        'bl_no' => 'BL-EXP-COMP-002',
        'status' => ExportStatus::Completed,
        'is_archive' => false,
        'created_at' => now()->subDays(6),
        'updated_at' => now()->subDays(2),
    ]);

    foreach (['boc', 'bl_generation', 'co', 'phytosanitary', 'cil', 'dccci', 'billing'] as $typeKey) {
        Document::factory()->create([
            'documentable_type' => ExportTransaction::class,
            'documentable_id' => $flaggedExport->id,
            'type' => $typeKey,
            'uploaded_by' => $admin->id,
        ]);
    }

    foreach (['boc', 'bl_generation', 'co', 'phytosanitary', 'cil', 'dccci', 'billing'] as $typeKey) {
        Document::factory()->create([
            'documentable_type' => ExportTransaction::class,
            'documentable_id' => $completedExport->id,
            'type' => $typeKey,
            'uploaded_by' => $admin->id,
        ]);
    }

    $completedExport->stages()->update([
        'billing_completed_at' => now()->subDays(2),
    ]);

    TransactionRemark::factory()->create([
        'remarkble_type' => ExportTransaction::class,
        'remarkble_id' => $flaggedExport->id,
        'author_id' => $admin->id,
        'message' => 'Carrier amendment still unresolved.',
        'is_resolved' => false,
        'created_at' => now()->subMinutes(30),
        'updated_at' => now()->subMinutes(30),
    ]);

    $auditLog = AuditLog::query()->create([
        'auditable_type' => ImportTransaction::class,
        'auditable_id' => $staleImport->id,
        'user_id' => $admin->id,
        'event' => AuditEvent::EncoderReassigned->value,
        'new_values' => [
            'description' => 'Admin User reassigned import #'.$staleImport->id.' from Mike Tan to Sarah Velasco.',
        ],
        'ip_address' => '127.0.0.1',
    ]);
    $auditLog->forceFill(['created_at' => now()->subHour()])->save();

    $response = $this->actingAs($admin)
        ->getJson('/api/admin/dashboard')
        ->assertOk();

    $workloads = collect($response->json('workloads'))->keyBy('name');
    $actionFeed = collect($response->json('action_feed'));
    $statusBreakdown = collect($response->json('analytics.status_breakdown'))->keyBy('key');
    $analytics = $response->json('analytics');

    $response
        ->assertJsonPath('kpis.active_imports', 1)
        ->assertJsonPath('kpis.active_exports', 1)
        ->assertJsonPath('kpis.delayed_shipments', 2)
        ->assertJsonPath('kpis.upcoming_eta_etd', 2)
        ->assertJsonPath('kpis.open_remarks', 1)
        ->assertJsonPath('kpis.missing_final_docs', 1)
        ->assertJsonPath('records_summary.in_review_count', 3)
        ->assertJsonPath('records_summary.completed_count', 2)
        ->assertJsonPath('records_summary.cancelled_count', 1)
        ->assertJsonPath('records_summary.missing_docs_count', 1)
        ->assertJsonPath('records_summary.archive_ready_count', 1)
        ->assertJsonPath('critical_operations.0.status', 'review')
        ->assertJsonPath('critical_operations.0.ref', 'BL-EXP-FLAG-001')
        ->assertJsonPath('critical_operations.1.status', 'missing')
        ->assertJsonPath('critical_operations.1.ref', 'IMP-1001')
        ->assertJsonPath('critical_operations.2.status', 'stuck')
        ->assertJsonPath('critical_operations.2.ref', 'IMP-0921')
        ->assertJsonPath('critical_operations.3.status', 'stuck')
        ->assertJsonPath('critical_operations.3.ref', $activeExport->bl_no)
        ->assertJsonPath('analytics.year', 2026)
        ->assertJsonPath('analytics.monthly_volume.year', 2026)
        ->assertJsonPath('analytics.monthly_volume.months.2.imports', 2)
        ->assertJsonPath('analytics.monthly_volume.months.2.exports', 3)
        ->assertJsonPath('analytics.monthly_volume.months.2.total', 5)
        ->assertJsonPath('analytics.transaction_flow.imports', 2)
        ->assertJsonPath('analytics.transaction_flow.exports', 3)
        ->assertJsonPath('analytics.transaction_flow.total', 5)
        ->assertJsonPath('analytics.transaction_flow.completed', 2)
        ->assertJsonPath('analytics.transaction_flow.completion_rate', 40)
        ->assertJsonPath('analytics.overdue_transactions.threshold_hours', 48)
        ->assertJsonPath('analytics.overdue_transactions.total', 2)
        ->assertJsonPath('analytics.overdue_transactions.imports.overdue_count', 1)
        ->assertJsonPath('analytics.overdue_transactions.imports.stale_48_72_count', 1)
        ->assertJsonPath('analytics.overdue_transactions.imports.stale_over_72_count', 0)
        ->assertJsonPath('analytics.overdue_transactions.imports.oldest_hours', 60)
        ->assertJsonPath('analytics.overdue_transactions.exports.overdue_count', 1)
        ->assertJsonPath('analytics.overdue_transactions.exports.stale_48_72_count', 0)
        ->assertJsonPath('analytics.overdue_transactions.exports.stale_over_72_count', 1)
        ->assertJsonPath('analytics.overdue_transactions.exports.oldest_hours', 80);

    expect($actionFeed->contains(fn (array $item): bool => $item['action'] === 'Document Alert'
        && $item['target'] === 'BL-EXP-FLAG-001'))
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
        'overdue' => 1,
    ]);

    expect($statusBreakdown->get('pending'))->toMatchArray([
        'label' => 'Pending',
        'value' => 0,
    ]);

    expect($statusBreakdown->get('in_progress'))->toMatchArray([
        'label' => 'In Progress',
        'value' => 2,
    ]);

    expect($statusBreakdown->get('completed'))->toMatchArray([
        'label' => 'Completed',
        'value' => 2,
    ]);

    expect($statusBreakdown->get('cancelled'))->toMatchArray([
        'label' => 'Cancelled',
        'value' => 1,
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
