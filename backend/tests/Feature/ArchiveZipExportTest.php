<?php

use App\Enums\ArchiveOrigin;
use App\Enums\ArchiveZipExportStatus;
use App\Jobs\GenerateArchiveZipExport;
use App\Models\ArchiveZipExport;
use App\Models\AuditLog;
use App\Models\Client;
use App\Models\Country;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchZipExport;
use App\Models\User;
use App\Support\Archives\ArchiveFolderZipBuilder;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->documentDisk = config('filesystems.default', 'local');

    Storage::fake($this->documentDisk);
});

test('admin can request archive folder zip export and download the prepared file', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $shipper = Client::factory()->exporter()->create();
    $country = Country::factory()->create();
    $uploader = User::factory()->create(['role' => 'encoder']);

    $transaction = ExportTransaction::factory()->create([
        'bl_no' => 'BL-ASYNC-ZIP-001',
        'shipper_id' => $shipper->id,
        'destination_country_id' => $country->id,
        'export_date' => '2026-04-10',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $uploader->id,
    ]);

    Storage::disk($this->documentDisk)->put(
        'transaction-documents/exports/2026/month-04-April/BL-ASYNC-ZIP-001/boc.pdf',
        'boc contents',
    );
    Storage::disk($this->documentDisk)->put(
        'transaction-documents/exports/2026/month-04-April/BL-ASYNC-ZIP-001/billing.pdf',
        'billing contents',
    );

    Document::factory()->create([
        'documentable_type' => ExportTransaction::class,
        'documentable_id' => $transaction->id,
        'type' => 'boc',
        'filename' => 'BOC Permit.pdf',
        'path' => 'transaction-documents/exports/2026/month-04-April/BL-ASYNC-ZIP-001/boc.pdf',
        'uploaded_by' => $uploader->id,
    ]);
    Document::factory()->create([
        'documentable_type' => ExportTransaction::class,
        'documentable_id' => $transaction->id,
        'type' => 'billing',
        'filename' => 'Billing Invoice.pdf',
        'path' => 'transaction-documents/exports/2026/month-04-April/BL-ASYNC-ZIP-001/billing.pdf',
        'uploaded_by' => $uploader->id,
    ]);

    Queue::fake();
    AuditLog::query()->delete();

    $this->actingAs($admin)
        ->postJson('/api/archive-zip-exports', [
            'year' => 2026,
            'month' => 4,
            'type' => 'export',
        ])
        ->assertAccepted()
        ->assertJsonPath('data.status', ArchiveZipExportStatus::Pending->value)
        ->assertJsonPath('data.filename', 'apr-2026-exports.zip');

    $archiveZipExport = ArchiveZipExport::query()->sole();
    expect(AuditLog::query()->where('auditable_type', ArchiveZipExport::class)->exists())->toBeFalse();

    Queue::assertPushed(
        GenerateArchiveZipExport::class,
        fn (GenerateArchiveZipExport $job): bool => $job->archiveZipExportId === $archiveZipExport->id,
    );

    (new GenerateArchiveZipExport($archiveZipExport->id))->handle(app(ArchiveFolderZipBuilder::class));

    $archiveZipExport->refresh();
    expect($archiveZipExport->status)->toBe(ArchiveZipExportStatus::Ready);
    expect($archiveZipExport->file_count)->toBe(2);
    expect($archiveZipExport->bl_count)->toBe(1);
    Storage::disk($this->documentDisk)->assertExists($archiveZipExport->file_path);

    $response = $this->actingAs($admin)
        ->get("/api/archive-zip-exports/{$archiveZipExport->uuid}/download")
        ->assertOk()
        ->assertDownload('apr-2026-exports.zip');

    $zipPath = tempnam(sys_get_temp_dir(), 'archive-zip-export-test-');
    file_put_contents($zipPath, $response->streamedContent());

    $zip = new ZipArchive;
    expect($zip->open($zipPath))->toBeTrue();
    expect($zip->getFromName('BL-ASYNC-ZIP-001/boc/BOC Permit.pdf'))->toBe('boc contents');
    expect($zip->getFromName('BL-ASYNC-ZIP-001/billing/Billing Invoice.pdf'))->toBe('billing contents');
    $zip->close();
    @unlink($zipPath);
});

test('archive zip export requests enforce full archive and owner access', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $otherUser = User::factory()->create(['role' => 'encoder']);

    Queue::fake();

    $this->actingAs($encoder)
        ->postJson('/api/archive-zip-exports', [
            'year' => 2026,
            'month' => 4,
            'type' => 'export',
        ])
        ->assertForbidden();

    $this->actingAs($encoder)
        ->postJson('/api/archive-zip-exports', [
            'year' => 2026,
            'month' => 4,
            'type' => 'export',
            'mine' => true,
        ])
        ->assertAccepted();

    $archiveZipExport = ArchiveZipExport::query()->sole();

    $this->actingAs($otherUser)
        ->getJson("/api/archive-zip-exports/{$archiveZipExport->uuid}/download")
        ->assertForbidden();
});

test('admin can request an entire archive year zip export', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $importer = Client::factory()->importer()->create();
    $shipper = Client::factory()->exporter()->create();
    $country = Country::factory()->create();
    $uploader = User::factory()->create(['role' => 'encoder']);

    $importTransaction = ImportTransaction::factory()->create([
        'bl_no' => 'BL-YEAR-ZIP-IMPORT',
        'importer_id' => $importer->id,
        'origin_country_id' => $country->id,
        'arrival_date' => '2026-03-08',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $uploader->id,
    ]);

    $exportTransaction = ExportTransaction::factory()->create([
        'bl_no' => 'BL-YEAR-ZIP-EXPORT',
        'shipper_id' => $shipper->id,
        'destination_country_id' => $country->id,
        'export_date' => '2026-04-12',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $uploader->id,
    ]);

    Storage::disk($this->documentDisk)->put('archive/import-entry.pdf', 'import entry contents');
    Storage::disk($this->documentDisk)->put('archive/export-billing.pdf', 'export billing contents');

    Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $importTransaction->id,
        'type' => 'entry',
        'filename' => 'Import Entry.pdf',
        'path' => 'archive/import-entry.pdf',
        'uploaded_by' => $uploader->id,
    ]);
    Document::factory()->create([
        'documentable_type' => ExportTransaction::class,
        'documentable_id' => $exportTransaction->id,
        'type' => 'billing',
        'filename' => 'Export Billing.pdf',
        'path' => 'archive/export-billing.pdf',
        'uploaded_by' => $uploader->id,
    ]);

    Queue::fake();

    $this->actingAs($admin)
        ->postJson('/api/archive-zip-exports', [
            'scope' => 'year',
            'year' => 2026,
        ])
        ->assertAccepted()
        ->assertJsonPath('data.scope', 'year')
        ->assertJsonPath('data.month', null)
        ->assertJsonPath('data.type', null)
        ->assertJsonPath('data.filename', 'fy-2026-archive.zip');

    $archiveZipExport = ArchiveZipExport::query()->sole();

    Queue::assertPushed(
        GenerateArchiveZipExport::class,
        fn (GenerateArchiveZipExport $job): bool => $job->archiveZipExportId === $archiveZipExport->id,
    );

    (new GenerateArchiveZipExport($archiveZipExport->id))->handle(app(ArchiveFolderZipBuilder::class));

    $archiveZipExport->refresh();

    expect($archiveZipExport->status)->toBe(ArchiveZipExportStatus::Ready);
    expect($archiveZipExport->file_count)->toBe(2);
    expect($archiveZipExport->bl_count)->toBe(2);

    $response = $this->actingAs($admin)
        ->get("/api/archive-zip-exports/{$archiveZipExport->uuid}/download")
        ->assertOk()
        ->assertDownload('fy-2026-archive.zip');

    $zipPath = tempnam(sys_get_temp_dir(), 'archive-year-zip-export-test-');
    file_put_contents($zipPath, $response->streamedContent());

    $zip = new ZipArchive;
    expect($zip->open($zipPath))->toBeTrue();
    expect($zip->getFromName('MAR 2026 IMPORTS/BL-YEAR-ZIP-IMPORT/entry/Import Entry.pdf'))->toBe('import entry contents');
    expect($zip->getFromName('APR 2026 EXPORTS/BL-YEAR-ZIP-EXPORT/billing/Export Billing.pdf'))->toBe('export billing contents');
    $zip->close();
    @unlink($zipPath);
});

test('archive zip export requests are capped at five active zip requests per user', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    foreach (range(1, 4) as $month) {
        ArchiveZipExport::factory()->ready()->create([
            'requested_by' => $admin->id,
            'year' => 2026,
            'month' => $month,
            'type' => 'export',
        ]);
    }

    $legacyBatch = LegacyBatch::factory()->completed()->create([
        'uploaded_by' => $admin->id,
    ]);
    LegacyBatchZipExport::factory()->ready()->create([
        'legacy_batch_id' => $legacyBatch->id,
        'requested_by' => $admin->id,
    ]);

    Queue::fake();

    $this->actingAs($admin)
        ->postJson('/api/archive-zip-exports', [
            'year' => 2026,
            'month' => 6,
            'type' => 'export',
        ])
        ->assertTooManyRequests()
        ->assertSeeText('You can only keep 5 active ZIP requests at a time.');

    Queue::assertNothingPushed();
});

test('failed archive zip exports can be retried and finished requests can be deleted', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $failedArchiveZipExport = ArchiveZipExport::factory()->failed()->create([
        'requested_by' => $admin->id,
    ]);
    $readyArchiveZipExport = ArchiveZipExport::factory()->ready()->create([
        'requested_by' => $admin->id,
    ]);

    Storage::disk($this->documentDisk)->put($readyArchiveZipExport->file_path, 'prepared zip');
    Queue::fake();

    $this->actingAs($admin)
        ->postJson("/api/archive-zip-exports/{$failedArchiveZipExport->uuid}/retry")
        ->assertAccepted()
        ->assertJsonPath('data.status', ArchiveZipExportStatus::Pending->value);

    Queue::assertPushed(
        GenerateArchiveZipExport::class,
        fn (GenerateArchiveZipExport $job): bool => $job->archiveZipExportId === $failedArchiveZipExport->id,
    );

    $this->actingAs($admin)
        ->deleteJson("/api/archive-zip-exports/{$readyArchiveZipExport->uuid}")
        ->assertNoContent();

    $this->assertModelMissing($readyArchiveZipExport);
    Storage::disk($this->documentDisk)->assertMissing($readyArchiveZipExport->file_path);
});

test('expired archive zip exports are pruned from storage', function () {
    $archiveZipExport = ArchiveZipExport::factory()->ready()->create([
        'expires_at' => now()->subMinute(),
    ]);

    Storage::disk($this->documentDisk)->put($archiveZipExport->file_path, 'prepared zip');

    $this->artisan('archive-zip-exports:prune-expired')
        ->assertExitCode(0);

    $archiveZipExport->refresh();

    expect($archiveZipExport->status)->toBe(ArchiveZipExportStatus::Expired);
    expect($archiveZipExport->file_path)->toBeNull();
    expect($archiveZipExport->file_size_bytes)->toBe(0);
    Storage::disk($this->documentDisk)->assertMissing('archive-zip-exports/test/archive-folder.zip');
});
