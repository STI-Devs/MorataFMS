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

    $response
        ->assertJsonPath('kpis.active_imports', 1)
        ->assertJsonPath('kpis.active_exports', 1)
        ->assertJsonPath('kpis.needs_update', 1)
        ->assertJsonPath('kpis.upcoming_eta_etd', 2)
        ->assertJsonPath('kpis.open_remarks', 1)
        ->assertJsonPath('kpis.document_gaps', 1);

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
});

test('non encoders cannot access the encoder dashboard endpoint', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $this->actingAs($admin)
        ->getJson('/api/encoder/dashboard')
        ->assertForbidden();
});
