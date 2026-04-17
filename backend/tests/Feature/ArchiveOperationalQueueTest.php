<?php

use App\Enums\ArchiveOrigin;
use App\Models\Client;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;

it('returns processor archive task records grouped by queue status', function () {
    $processor = User::factory()->create(['role' => 'processor']);
    $encoder = User::factory()->create(['role' => 'encoder']);
    $admin = User::factory()->create(['role' => 'admin']);
    $importer = Client::factory()->importer()->create();
    $shipper = Client::factory()->exporter()->create();

    $needsMyUpload = createArchiveImportRecord([
        'bl_no' => 'BL-ARCH-PROC-NEEDS',
        'importer_id' => $importer->id,
        'selective_color' => 'yellow',
    ]);
    attachStageDocument($needsMyUpload, 'boc', $encoder);
    attachStageDocument($needsMyUpload, 'bonds', $encoder);
    attachStageDocument($needsMyUpload, 'do', $encoder);
    attachStageDocument($needsMyUpload, 'releasing', $encoder);
    attachStageDocument($needsMyUpload, 'billing', $admin);

    $completedByMe = createArchiveImportRecord([
        'bl_no' => 'BL-ARCH-PROC-MINE',
        'importer_id' => $importer->id,
    ]);
    foreach (['boc', 'bonds', 'ppa', 'do', 'port_charges', 'releasing', 'billing'] as $stage) {
        attachStageDocument($completedByMe, $stage, $stage === 'ppa' || $stage === 'port_charges' ? $processor : $encoder);
    }

    $alreadySupplied = createArchiveImportRecord([
        'bl_no' => 'BL-ARCH-PROC-SHARED',
        'importer_id' => $importer->id,
    ]);
    foreach (['boc', 'bonds', 'ppa', 'do', 'releasing', 'billing'] as $stage) {
        attachStageDocument($alreadySupplied, $stage, $encoder);
    }
    $alreadySupplied->setStageApplicability('port_charges', true, $encoder->id);

    $waitingOnOthers = createArchiveExportRecord([
        'bl_no' => 'BL-ARCH-PROC-WAIT',
        'shipper_id' => $shipper->id,
    ]);
    foreach (['boc', 'bl_generation', 'phytosanitary', 'co', 'cil'] as $stage) {
        attachStageDocument($waitingOnOthers, $stage, $stage === 'cil' ? $admin : $encoder);
    }
    $waitingOnOthers->setStageApplicability('dccci', true, $admin->id);

    $response = $this->actingAs($processor)
        ->getJson('/api/archives/operational')
        ->assertOk();

    $records = collect($response->json('data'))->keyBy('bl_no');

    expect($response->json('stats'))->toMatchArray([
        'needs_my_upload' => 1,
        'waiting_on_others' => 1,
        'completed_by_me' => 1,
        'already_supplied' => 1,
        'shared_records' => 4,
    ]);

    expect($records->get('BL-ARCH-PROC-NEEDS')['queue_status'])->toBe('needs_my_upload');
    expect($records->get('BL-ARCH-PROC-NEEDS')['selective_color'])->toBe('yellow');
    expect(collect($records->get('BL-ARCH-PROC-NEEDS')['my_stage_summaries'])->pluck('state')->all())
        ->toBe(['missing', 'missing']);

    expect($records->get('BL-ARCH-PROC-MINE')['queue_status'])->toBe('completed_by_me');
    expect(collect($records->get('BL-ARCH-PROC-MINE')['my_stage_summaries'])->pluck('state')->all())
        ->toBe(['uploaded_by_me', 'uploaded_by_me']);

    expect($records->get('BL-ARCH-PROC-SHARED')['queue_status'])->toBe('already_supplied');
    expect(collect($records->get('BL-ARCH-PROC-SHARED')['my_stage_summaries'])->pluck('state')->all())
        ->toBe(['uploaded_by_encoder', 'not_applicable']);

    expect($records->get('BL-ARCH-PROC-WAIT')['queue_status'])->toBe('waiting_on_others');
    expect($records->get('BL-ARCH-PROC-WAIT')['type'])->toBe('export');
    expect($records->get('BL-ARCH-PROC-WAIT')['my_stage_keys'])->toBe(['cil', 'dccci']);
});

it('returns accounting archive task records with billing as the only owned stage', function () {
    $accountant = User::factory()->create(['role' => 'accounting']);
    $encoder = User::factory()->create(['role' => 'encoder']);
    $importer = Client::factory()->importer()->create();
    $shipper = Client::factory()->exporter()->create();

    $needsBilling = createArchiveExportRecord([
        'bl_no' => 'BL-ARCH-ACC-NEEDS',
        'shipper_id' => $shipper->id,
    ]);
    foreach (['boc', 'bl_generation', 'phytosanitary', 'co', 'cil', 'dccci'] as $stage) {
        attachStageDocument($needsBilling, $stage, $encoder);
    }

    $completedByMe = createArchiveImportRecord([
        'bl_no' => 'BL-ARCH-ACC-MINE',
        'importer_id' => $importer->id,
    ]);
    foreach (['boc', 'bonds', 'ppa', 'do', 'port_charges', 'releasing'] as $stage) {
        attachStageDocument($completedByMe, $stage, $encoder);
    }
    attachStageDocument($completedByMe, 'billing', $accountant);

    $response = $this->actingAs($accountant)
        ->getJson('/api/archives/operational')
        ->assertOk();

    $records = collect($response->json('data'))->keyBy('bl_no');

    expect($response->json('stats'))->toMatchArray([
        'needs_my_upload' => 1,
        'waiting_on_others' => 0,
        'completed_by_me' => 1,
        'already_supplied' => 0,
        'shared_records' => 2,
    ]);

    expect($records->get('BL-ARCH-ACC-NEEDS')['my_stage_keys'])->toBe(['billing']);
    expect($records->get('BL-ARCH-ACC-NEEDS')['queue_status'])->toBe('needs_my_upload');
    expect(collect($records->get('BL-ARCH-ACC-NEEDS')['my_stage_summaries'])->pluck('key')->all())->toBe(['billing']);
    expect(collect($records->get('BL-ARCH-ACC-MINE')['my_stage_summaries'])->pluck('state')->all())->toBe(['uploaded_by_me']);
});

it('lets processor users list shared archive documents for a transaction uploaded by another user', function () {
    $processor = User::factory()->create(['role' => 'processor']);
    $encoder = User::factory()->create(['role' => 'encoder']);
    $importer = Client::factory()->importer()->create();

    $archiveTransaction = createArchiveImportRecord([
        'bl_no' => 'BL-ARCH-DOC-VISIBILITY',
        'importer_id' => $importer->id,
    ]);
    $sharedDocument = attachStageDocument($archiveTransaction, 'ppa', $encoder);

    $this->actingAs($processor)
        ->getJson('/api/documents?documentable_type='.urlencode(ImportTransaction::class).'&documentable_id='.$archiveTransaction->id)
        ->assertOk()
        ->assertJsonPath('data.0.id', $sharedDocument->id)
        ->assertJsonPath('data.0.uploaded_by.id', $encoder->id);
});

it('forbids non-operational users from the archive task queue endpoint', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);

    $this->actingAs($encoder)
        ->getJson('/api/archives/operational')
        ->assertForbidden();
});

function createArchiveImportRecord(array $attributes = []): ImportTransaction
{
    return ImportTransaction::factory()->create([
        'status' => 'Completed',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'arrival_date' => '2026-03-15',
        'customs_ref_no' => fake()->unique()->numerify('REF-ARCH-####'),
        ...$attributes,
    ]);
}

function createArchiveExportRecord(array $attributes = []): ExportTransaction
{
    return ExportTransaction::factory()->create([
        'status' => 'Completed',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'export_date' => '2026-03-15',
        ...$attributes,
    ]);
}

function attachStageDocument(ImportTransaction|ExportTransaction $transaction, string $stage, User $uploader): Document
{
    $document = Document::factory()->create([
        'documentable_type' => $transaction::class,
        'documentable_id' => $transaction->id,
        'uploaded_by' => $uploader->id,
        'type' => $stage,
    ]);

    $transaction->syncStageCompletionForDocument($stage, $uploader->id);
    $transaction->unsetRelation('documents');
    $transaction->load('documents.uploadedBy');

    return $document->fresh(['uploadedBy']);
}
