<?php

use App\Enums\ArchiveZipExportStatus;
use App\Enums\LegacyBatchFileStatus;
use App\Enums\LegacyBatchStatus;
use App\Jobs\GenerateLegacyBatchZipExport;
use App\Models\AuditLog;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchZipExport;
use App\Models\User;
use App\Support\LegacyBatches\LegacyBatchZipBuilder;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->documentDisk = config('filesystems.default', 'local');

    Storage::fake($this->documentDisk);
});

test('admin can request legacy batch zip export and download the prepared file', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->completed()->create([
        'uploaded_by' => $admin->id,
        'batch_name' => 'MAERSK FILE',
        'root_folder' => '2023 SEALAND',
        'expected_file_count' => 2,
        'uploaded_file_count' => 2,
        'total_size_bytes' => 24,
    ]);

    $firstFile = $batch->files()->create([
        'relative_path' => '2023 SEALAND/KOTA HAKIM/BL COPY.pdf',
        'storage_path' => 'legacy-batches/'.$batch->uuid.'/2023 SEALAND/KOTA HAKIM/BL COPY.pdf',
        'filename' => 'BL COPY.pdf',
        'mime_type' => 'application/pdf',
        'size_bytes' => 12,
        'status' => LegacyBatchFileStatus::Uploaded,
        'uploaded_at' => now(),
    ]);

    $secondFile = $batch->files()->create([
        'relative_path' => '2023 SEALAND/KOTA HAKIM/ENTRY.pdf',
        'storage_path' => 'legacy-batches/'.$batch->uuid.'/2023 SEALAND/KOTA HAKIM/ENTRY.pdf',
        'filename' => 'ENTRY.pdf',
        'mime_type' => 'application/pdf',
        'size_bytes' => 12,
        'status' => LegacyBatchFileStatus::Uploaded,
        'uploaded_at' => now(),
    ]);

    Storage::disk($this->documentDisk)->put($firstFile->storage_path, 'bl contents');
    Storage::disk($this->documentDisk)->put($secondFile->storage_path, 'entry contents');

    Queue::fake();
    AuditLog::query()->delete();

    $this->actingAs($admin)
        ->postJson("/api/legacy-batches/{$batch->uuid}/zip-export")
        ->assertAccepted()
        ->assertJsonPath('data.status', ArchiveZipExportStatus::Pending->value)
        ->assertJsonPath('data.filename', 'maersk-file.zip')
        ->assertJsonPath('data.legacy_batch_id', $batch->uuid);

    $legacyBatchZipExport = LegacyBatchZipExport::query()->sole();
    expect(AuditLog::query()->where('auditable_type', LegacyBatchZipExport::class)->exists())->toBeFalse();

    Queue::assertPushed(
        GenerateLegacyBatchZipExport::class,
        fn (GenerateLegacyBatchZipExport $job): bool => $job->legacyBatchZipExportId === $legacyBatchZipExport->id,
    );

    (new GenerateLegacyBatchZipExport($legacyBatchZipExport->id))->handle(app(LegacyBatchZipBuilder::class));

    $legacyBatchZipExport->refresh();

    expect($legacyBatchZipExport->status)->toBe(ArchiveZipExportStatus::Ready);
    expect($legacyBatchZipExport->file_count)->toBe(2);
    Storage::disk($this->documentDisk)->assertExists($legacyBatchZipExport->file_path);

    $response = $this->actingAs($admin)
        ->get("/api/legacy-batch-zip-exports/{$legacyBatchZipExport->uuid}/download")
        ->assertOk()
        ->assertDownload('maersk-file.zip');

    $zipPath = tempnam(sys_get_temp_dir(), 'legacy-batch-zip-export-test-');
    file_put_contents($zipPath, $response->streamedContent());

    $zip = new ZipArchive;
    expect($zip->open($zipPath))->toBeTrue();
    expect($zip->getFromName('2023 SEALAND/KOTA HAKIM/BL COPY.pdf'))->toBe('bl contents');
    expect($zip->getFromName('2023 SEALAND/KOTA HAKIM/ENTRY.pdf'))->toBe('entry contents');
    $zip->close();
    @unlink($zipPath);
});

test('legacy batch zip exports are admin only and require completed batches', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->completed()->create([
        'uploaded_by' => $encoder->id,
        'expected_file_count' => 1,
        'uploaded_file_count' => 1,
    ]);

    Queue::fake();

    $this->actingAs($encoder)
        ->postJson("/api/legacy-batches/{$batch->uuid}/zip-export")
        ->assertForbidden();

    $interruptedBatch = LegacyBatch::factory()->create([
        'uploaded_by' => $admin->id,
        'status' => LegacyBatchStatus::Interrupted,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/legacy-batches/{$interruptedBatch->uuid}/zip-export")
        ->assertStatus(409)
        ->assertSeeText('Only completed legacy batches can be prepared as ZIP downloads.');
});

test('admin can list legacy batch zip exports by module and status', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $encoder = User::factory()->create(['role' => 'encoder']);
    $brokerageBatch = LegacyBatch::factory()->completed()->create([
        'uploaded_by' => $admin->id,
        'batch_name' => 'APRIL 2026',
        'root_folder' => 'APRIL 2026',
        'module' => 'brokerage',
    ]);
    $legalBatch = LegacyBatch::factory()->completed()->create([
        'uploaded_by' => $admin->id,
        'batch_name' => 'LEGAL ARCHIVE',
        'root_folder' => 'LEGAL ARCHIVE',
        'module' => 'legal',
    ]);
    $readyLegacyBatchZipExport = LegacyBatchZipExport::factory()->ready()->create([
        'legacy_batch_id' => $brokerageBatch->id,
        'requested_by' => $admin->id,
        'file_count' => 5,
    ]);
    LegacyBatchZipExport::factory()->failed()->create([
        'legacy_batch_id' => $brokerageBatch->id,
        'requested_by' => $admin->id,
    ]);
    LegacyBatchZipExport::factory()->ready()->create([
        'legacy_batch_id' => $legalBatch->id,
        'requested_by' => $admin->id,
    ]);

    $this->actingAs($encoder)
        ->getJson('/api/legacy-batch-zip-exports')
        ->assertForbidden();

    $this->actingAs($admin)
        ->getJson('/api/legacy-batch-zip-exports?module=brokerage&status=ready')
        ->assertSuccessful()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $readyLegacyBatchZipExport->uuid)
        ->assertJsonPath('data.0.legacy_batch.id', $brokerageBatch->uuid)
        ->assertJsonPath('data.0.legacy_batch.batch_name', 'APRIL 2026')
        ->assertJsonPath('data.0.legacy_batch.module', 'brokerage')
        ->assertJsonPath('data.0.file_count', 5);
});

test('legacy batch zip export requests are idempotent while active', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->completed()->create([
        'uploaded_by' => $admin->id,
    ]);

    Queue::fake();

    $firstResponse = $this->actingAs($admin)
        ->postJson("/api/legacy-batches/{$batch->uuid}/zip-export")
        ->assertAccepted();

    $secondResponse = $this->actingAs($admin)
        ->postJson("/api/legacy-batches/{$batch->uuid}/zip-export")
        ->assertAccepted();

    expect($firstResponse->json('data.id'))->toBe($secondResponse->json('data.id'));
    expect(LegacyBatchZipExport::query()->count())->toBe(1);

    Queue::assertPushed(GenerateLegacyBatchZipExport::class, 1);
});

test('failed legacy batch zip exports can be retried and finished requests can be deleted', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->completed()->create([
        'uploaded_by' => $admin->id,
    ]);
    $failedLegacyBatchZipExport = LegacyBatchZipExport::factory()->failed()->create([
        'legacy_batch_id' => $batch->id,
        'requested_by' => $admin->id,
    ]);
    $readyLegacyBatchZipExport = LegacyBatchZipExport::factory()->ready()->create([
        'legacy_batch_id' => $batch->id,
        'requested_by' => $admin->id,
    ]);

    Storage::disk($this->documentDisk)->put($readyLegacyBatchZipExport->file_path, 'prepared zip');
    Queue::fake();

    $this->actingAs($admin)
        ->postJson("/api/legacy-batch-zip-exports/{$failedLegacyBatchZipExport->uuid}/retry")
        ->assertAccepted()
        ->assertJsonPath('data.status', ArchiveZipExportStatus::Pending->value);

    Queue::assertPushed(
        GenerateLegacyBatchZipExport::class,
        fn (GenerateLegacyBatchZipExport $job): bool => $job->legacyBatchZipExportId === $failedLegacyBatchZipExport->id,
    );

    $this->actingAs($admin)
        ->deleteJson("/api/legacy-batch-zip-exports/{$readyLegacyBatchZipExport->uuid}")
        ->assertNoContent();

    $this->assertModelMissing($readyLegacyBatchZipExport);
    Storage::disk($this->documentDisk)->assertMissing($readyLegacyBatchZipExport->file_path);
});

test('expired legacy batch zip exports are pruned from storage', function () {
    $legacyBatchZipExport = LegacyBatchZipExport::factory()->ready()->create([
        'expires_at' => now()->subMinute(),
    ]);
    $filePath = $legacyBatchZipExport->file_path;

    Storage::disk($this->documentDisk)->put($filePath, 'prepared zip');

    $this->artisan('legacy-batch-zip-exports:prune-expired')
        ->assertExitCode(0);

    $legacyBatchZipExport->refresh();

    expect($legacyBatchZipExport->status)->toBe(ArchiveZipExportStatus::Expired);
    expect($legacyBatchZipExport->file_path)->toBeNull();
    expect($legacyBatchZipExport->file_size_bytes)->toBe(0);
    Storage::disk($this->documentDisk)->assertMissing($filePath);
});
