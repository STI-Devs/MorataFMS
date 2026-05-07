<?php

use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
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

test('encoder dashboard returns only the authenticated encoder workload', function () {
    $encoder = User::factory()->create([
        'role' => 'encoder',
        'name' => 'Claire Florino',
    ]);

    $otherEncoder = User::factory()->create([
        'role' => 'encoder',
        'name' => 'Other Encoder',
    ]);

    $staleImport = ImportTransaction::factory()->create([
        'customs_ref_no' => 'IMP-ENC-001',
        'status' => ImportStatus::Processing,
        'assigned_user_id' => $encoder->id,
        'is_archive' => false,
        'arrival_date' => now()->addDays(2),
        'created_at' => now()->subDays(5),
        'updated_at' => now()->subDays(3),
    ]);

    ExportTransaction::factory()->create([
        'bl_no' => 'BL-ENC-001',
        'status' => ExportStatus::Processing,
        'assigned_user_id' => $encoder->id,
        'is_archive' => false,
        'export_date' => now()->addDays(4),
        'created_at' => now()->subDays(2),
        'updated_at' => now()->subHours(4),
    ]);

    $missingDocsExport = ExportTransaction::factory()->create([
        'bl_no' => 'BL-MISSING-001',
        'status' => ExportStatus::Completed,
        'assigned_user_id' => $encoder->id,
        'is_archive' => false,
        'updated_at' => now()->subHours(6),
    ]);

    $remarkImport = ImportTransaction::factory()->create([
        'customs_ref_no' => 'IMP-REMARK-001',
        'status' => ImportStatus::Completed,
        'assigned_user_id' => $encoder->id,
        'is_archive' => false,
        'updated_at' => now()->subMinutes(30),
    ]);

    foreach (['boc', 'bonds', 'ppa', 'do', 'port_charges', 'releasing', 'billing'] as $typeKey) {
        Document::factory()->create([
            'documentable_type' => ImportTransaction::class,
            'documentable_id' => $remarkImport->id,
            'type' => $typeKey,
            'uploaded_by' => $encoder->id,
        ]);
    }

    $remarkImport->stages()->update([
        'boc_completed_by' => $encoder->id,
        'boc_completed_at' => now()->subDay(),
        'billing_completed_by' => $encoder->id,
        'billing_completed_at' => now()->subHours(2),
    ]);

    $missingDocsExport->stages()->update([
        'cil_completed_by' => $encoder->id,
        'cil_completed_at' => now()->subDay(),
        'billing_completed_by' => $encoder->id,
        'billing_completed_at' => now()->subHours(3),
    ]);

    Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $remarkImport->id,
        'type' => 'others',
        'uploaded_by' => $encoder->id,
        'created_at' => now()->subYear(),
        'updated_at' => now()->subYear(),
    ]);

    Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $remarkImport->id,
        'type' => 'others',
        'uploaded_by' => $otherEncoder->id,
    ]);

    TransactionRemark::factory()->create([
        'remarkble_type' => ImportTransaction::class,
        'remarkble_id' => $remarkImport->id,
        'author_id' => $encoder->id,
        'message' => 'Client correction still pending.',
        'is_resolved' => false,
        'created_at' => now()->subMinutes(30),
        'updated_at' => now()->subMinutes(30),
    ]);

    ImportTransaction::factory()->create([
        'customs_ref_no' => 'IMP-OTHER-001',
        'status' => ImportStatus::Processing,
        'assigned_user_id' => $otherEncoder->id,
        'is_archive' => false,
        'arrival_date' => now()->addDays(1),
        'updated_at' => now()->subDays(3),
    ]);

    $response = $this->actingAs($encoder)
        ->getJson('/api/encoder/dashboard')
        ->assertOk();

    $attentionItems = collect($response->json('attention_items'));
    $importStageCounts = collect($response->json('analytics.activity.stages_completed.this_month.imports.stages'))
        ->keyBy('key');
    $exportStageCounts = collect($response->json('analytics.activity.stages_completed.this_month.exports.stages'))
        ->keyBy('key');

    $response
        ->assertJsonPath('kpis.active_imports', 1)
        ->assertJsonPath('kpis.active_exports', 1)
        ->assertJsonPath('kpis.needs_update', 1)
        ->assertJsonPath('kpis.upcoming_eta_etd', 2)
        ->assertJsonPath('kpis.open_remarks', 1)
        ->assertJsonPath('kpis.document_gaps', 1)
        ->assertJsonPath('reports.year', 2026)
        ->assertJsonPath('reports.month', 3)
        ->assertJsonPath('reports.monthly_volume.total_imports', 2)
        ->assertJsonPath('reports.monthly_volume.total_exports', 2)
        ->assertJsonPath('reports.monthly_volume.total', 4)
        ->assertJsonPath('reports.turnaround.imports.completed_count', 1)
        ->assertJsonPath('reports.turnaround.exports.completed_count', 1)
        ->assertJsonPath('analytics.year', 2026)
        ->assertJsonPath('analytics.month', 3)
        ->assertJsonPath('analytics.activity.transactions_completed.this_month.imports', 1)
        ->assertJsonPath('analytics.activity.transactions_completed.this_month.exports', 1)
        ->assertJsonPath('analytics.activity.transactions_completed.this_month.total', 2)
        ->assertJsonPath('analytics.activity.transactions_completed.this_year.total', 2)
        ->assertJsonPath('analytics.activity.documents_uploaded.this_month.total', 7)
        ->assertJsonPath('analytics.activity.documents_uploaded.this_month.imports', 7)
        ->assertJsonPath('analytics.activity.documents_uploaded.this_year.total', 7)
        ->assertJsonPath('analytics.activity.stages_completed.this_month.total', 4)
        ->assertJsonPath('analytics.activity.stages_completed.this_month.imports.total', 2)
        ->assertJsonPath('analytics.activity.stages_completed.this_month.exports.total', 2)
        ->assertJsonPath('analytics.activity.records_finalized.this_month.imports', 1)
        ->assertJsonPath('analytics.activity.records_finalized.this_month.exports', 1)
        ->assertJsonPath('analytics.activity.records_finalized.this_month.total', 2)
        ->assertJsonPath('analytics.overdue_transactions.total', 1);

    expect($attentionItems->contains(fn (array $item): bool => $item['status'] === 'remark'
        && $item['ref'] === 'IMP-REMARK-001'))
        ->toBeTrue();

    expect($attentionItems->contains(fn (array $item): bool => $item['status'] === 'missing'
        && $item['ref'] === $missingDocsExport->bl_no))
        ->toBeTrue();

    expect($attentionItems->contains(fn (array $item): bool => $item['status'] === 'needs_update'
        && $item['ref'] === $staleImport->customs_ref_no))
        ->toBeTrue();

    expect($attentionItems->contains(fn (array $item): bool => $item['ref'] === 'IMP-OTHER-001'))
        ->toBeFalse();

    expect($importStageCounts->get('boc'))->toMatchArray([
        'label' => 'BOC Document Processing',
        'count' => 1,
    ]);

    expect($importStageCounts->get('billing'))->toMatchArray([
        'label' => 'Billing and Liquidation',
        'count' => 1,
    ]);

    expect($exportStageCounts->get('cil'))->toMatchArray([
        'label' => 'CIL',
        'count' => 1,
    ]);

    expect($exportStageCounts->get('billing'))->toMatchArray([
        'label' => 'Billing and Liquidation',
        'count' => 1,
    ]);
});

test('non encoders cannot access the encoder dashboard endpoint', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $this->actingAs($admin)
        ->getJson('/api/encoder/dashboard')
        ->assertForbidden();
});
