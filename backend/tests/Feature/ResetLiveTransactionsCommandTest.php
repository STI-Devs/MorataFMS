<?php

use App\Models\AuditLog;
use App\Models\Client;
use App\Models\Document;
use App\Models\ExportStage;
use App\Models\ExportTransaction;
use App\Models\ImportStage;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;
use App\Support\Operations\Deletion\LiveTransactions\LiveTransactionResetter;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    config(['filesystems.document_disk' => 's3']);
    Storage::fake('s3');
});

test('ops reset live transactions previews the reset scope without deleting data', function () {
    [$liveImport, $liveExport, $archivedImport, $archivedExport] = seedResetScenario();

    $this->artisan('ops:reset-live-transactions', ['--dry-run' => true])
        ->expectsOutputToContain('Live transaction reset scope')
        ->expectsOutputToContain('Database connection: sqlite')
        ->expectsOutputToContain('Dry run only. No data was deleted.')
        ->assertSuccessful();

    expect(ImportTransaction::query()->whereKey($liveImport->id)->exists())->toBeTrue();
    expect(ExportTransaction::query()->whereKey($liveExport->id)->exists())->toBeTrue();
    expect(ImportTransaction::query()->whereKey($archivedImport->id)->exists())->toBeTrue();
    expect(ExportTransaction::query()->whereKey($archivedExport->id)->exists())->toBeTrue();
});

test('ops reset live transactions deletes only the live transaction graph', function () {
    [$liveImport, $liveExport, $archivedImport, $archivedExport, $liveImportDocument, $liveExportDocument, $archivedImportDocument, $archivedExportDocument, $liveImportRemark, $liveExportRemark, $client, $user] = seedResetScenario();

    $this->artisan('ops:reset-live-transactions', ['--force' => true])
        ->expectsOutputToContain('Live transaction reset complete.')
        ->assertSuccessful();

    expect(ImportTransaction::query()->whereKey($liveImport->id)->exists())->toBeFalse();
    expect(ExportTransaction::query()->whereKey($liveExport->id)->exists())->toBeFalse();
    expect(ImportTransaction::query()->whereKey($archivedImport->id)->exists())->toBeTrue();
    expect(ExportTransaction::query()->whereKey($archivedExport->id)->exists())->toBeTrue();

    expect(ImportStage::query()->where('import_transaction_id', $liveImport->id)->exists())->toBeFalse();
    expect(ExportStage::query()->where('export_transaction_id', $liveExport->id)->exists())->toBeFalse();
    expect(ImportStage::query()->where('import_transaction_id', $archivedImport->id)->exists())->toBeTrue();
    expect(ExportStage::query()->where('export_transaction_id', $archivedExport->id)->exists())->toBeTrue();

    expect(Document::query()->whereKey($liveImportDocument->id)->exists())->toBeFalse();
    expect(Document::query()->whereKey($liveExportDocument->id)->exists())->toBeFalse();
    expect(Document::query()->whereKey($archivedImportDocument->id)->exists())->toBeTrue();
    expect(Document::query()->whereKey($archivedExportDocument->id)->exists())->toBeTrue();

    expect(TransactionRemark::query()->where('remarkble_type', ImportTransaction::class)->where('remarkble_id', $liveImport->id)->exists())->toBeFalse();
    expect(TransactionRemark::query()->where('remarkble_type', ExportTransaction::class)->where('remarkble_id', $liveExport->id)->exists())->toBeFalse();
    expect(TransactionRemark::query()->where('remarkble_type', ImportTransaction::class)->where('remarkble_id', $archivedImport->id)->exists())->toBeTrue();
    expect(TransactionRemark::query()->where('remarkble_type', ExportTransaction::class)->where('remarkble_id', $archivedExport->id)->exists())->toBeTrue();

    expect(AuditLog::query()->where('auditable_type', ImportTransaction::class)->where('auditable_id', $liveImport->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('auditable_type', ExportTransaction::class)->where('auditable_id', $liveExport->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('auditable_type', Document::class)->where('auditable_id', $liveImportDocument->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('auditable_type', Document::class)->where('auditable_id', $liveExportDocument->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('auditable_type', TransactionRemark::class)->where('auditable_id', $liveImportRemark->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('auditable_type', TransactionRemark::class)->where('auditable_id', $liveExportRemark->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('auditable_type', ImportTransaction::class)->where('auditable_id', $archivedImport->id)->exists())->toBeTrue();
    expect(AuditLog::query()->where('auditable_type', ExportTransaction::class)->where('auditable_id', $archivedExport->id)->exists())->toBeTrue();

    Storage::disk('s3')->assertMissing($liveImportDocument->path);
    Storage::disk('s3')->assertMissing($liveExportDocument->path);
    Storage::disk('s3')->assertExists($archivedImportDocument->path);
    Storage::disk('s3')->assertExists($archivedExportDocument->path);

    expect(User::query()->whereKey($user->id)->exists())->toBeTrue();
    expect(Client::query()->whereKey($client->id)->exists())->toBeTrue();
});

test('ops reset live transactions cancels when confirmation is rejected', function () {
    [$liveImport] = seedResetScenario();

    $this->artisan('ops:reset-live-transactions')
        ->expectsConfirmation('This will permanently delete live transactions and their related data. Continue?', 'no')
        ->expectsOutputToContain('Operation cancelled. No data was deleted.')
        ->assertFailed();

    expect(ImportTransaction::query()->whereKey($liveImport->id)->exists())->toBeTrue();
});

test('ops reset live transactions rejects an unknown connection name', function () {
    $this->artisan('ops:reset-live-transactions', [
        '--connection' => 'missing_ops_connection',
    ])
        ->expectsOutputToContain('The database connection [missing_ops_connection] is not configured.')
        ->assertFailed();
});

test('live transaction resetter summarizes the explicit per-table deletion scope', function () {
    seedResetScenario();

    $plan = app(LiveTransactionResetter::class)->summarize(config('database.default'));
    $summary = $plan->summary();

    expect($summary['import_count'])->toBe(1);
    expect($summary['export_count'])->toBe(1);
    expect($summary['import_stage_count'])->toBe(1);
    expect($summary['export_stage_count'])->toBe(1);
    expect($summary['document_count'])->toBe(2);
    expect($summary['remark_count'])->toBe(2);
    expect($summary['audit_log_count'])->toBeGreaterThan(0);
    expect($summary['storage_disk'])->toBe('s3');
});

/**
 * @return array{0: ImportTransaction, 1: ExportTransaction, 2: ImportTransaction, 3: ExportTransaction, 4: Document, 5: Document, 6: Document, 7: Document, 8: TransactionRemark, 9: TransactionRemark, 10: Client, 11: User}
 */
function seedResetScenario(): array
{
    $user = User::factory()->create();
    $client = Client::factory()->create();

    $liveImport = ImportTransaction::factory()->create([
        'importer_id' => $client->id,
        'assigned_user_id' => $user->id,
        'is_archive' => false,
    ]);

    $liveExport = ExportTransaction::factory()->create([
        'shipper_id' => $client->id,
        'assigned_user_id' => $user->id,
        'is_archive' => false,
    ]);

    $archivedImport = ImportTransaction::factory()->create([
        'importer_id' => $client->id,
        'assigned_user_id' => $user->id,
        'is_archive' => true,
    ]);

    $archivedExport = ExportTransaction::factory()->create([
        'shipper_id' => $client->id,
        'assigned_user_id' => $user->id,
        'is_archive' => true,
    ]);

    $liveImportDocument = Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $liveImport->id,
        'uploaded_by' => $user->id,
        'type' => 'boc',
        'path' => 'transaction-documents/import-live.pdf',
    ]);
    Storage::disk('s3')->put($liveImportDocument->path, 'live import');

    $liveExportDocument = Document::factory()->create([
        'documentable_type' => ExportTransaction::class,
        'documentable_id' => $liveExport->id,
        'uploaded_by' => $user->id,
        'type' => 'boc',
        'path' => 'transaction-documents/export-live.pdf',
    ]);
    Storage::disk('s3')->put($liveExportDocument->path, 'live export');

    $archivedImportDocument = Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $archivedImport->id,
        'uploaded_by' => $user->id,
        'type' => 'boc',
        'path' => 'transaction-documents/import-archived.pdf',
    ]);
    Storage::disk('s3')->put($archivedImportDocument->path, 'archived import');

    $archivedExportDocument = Document::factory()->create([
        'documentable_type' => ExportTransaction::class,
        'documentable_id' => $archivedExport->id,
        'uploaded_by' => $user->id,
        'type' => 'boc',
        'path' => 'transaction-documents/export-archived.pdf',
    ]);
    Storage::disk('s3')->put($archivedExportDocument->path, 'archived export');

    $liveImportRemark = TransactionRemark::factory()->create([
        'remarkble_type' => ImportTransaction::class,
        'remarkble_id' => $liveImport->id,
        'author_id' => $user->id,
        'document_id' => $liveImportDocument->id,
    ]);

    $liveExportRemark = TransactionRemark::factory()->create([
        'remarkble_type' => ExportTransaction::class,
        'remarkble_id' => $liveExport->id,
        'author_id' => $user->id,
        'document_id' => $liveExportDocument->id,
    ]);

    TransactionRemark::factory()->create([
        'remarkble_type' => ImportTransaction::class,
        'remarkble_id' => $archivedImport->id,
        'author_id' => $user->id,
        'document_id' => $archivedImportDocument->id,
    ]);

    TransactionRemark::factory()->create([
        'remarkble_type' => ExportTransaction::class,
        'remarkble_id' => $archivedExport->id,
        'author_id' => $user->id,
        'document_id' => $archivedExportDocument->id,
    ]);

    AuditLog::query()->create([
        'auditable_type' => ImportTransaction::class,
        'auditable_id' => $liveImport->id,
        'user_id' => $user->id,
        'event' => 'created',
        'new_values' => ['bl_no' => $liveImport->bl_no],
        'ip_address' => '127.0.0.1',
    ]);

    AuditLog::query()->create([
        'auditable_type' => ExportTransaction::class,
        'auditable_id' => $liveExport->id,
        'user_id' => $user->id,
        'event' => 'created',
        'new_values' => ['bl_no' => $liveExport->bl_no],
        'ip_address' => '127.0.0.1',
    ]);

    AuditLog::query()->create([
        'auditable_type' => Document::class,
        'auditable_id' => $liveImportDocument->id,
        'user_id' => $user->id,
        'event' => 'created',
        'new_values' => ['filename' => $liveImportDocument->filename],
        'ip_address' => '127.0.0.1',
    ]);

    AuditLog::query()->create([
        'auditable_type' => TransactionRemark::class,
        'auditable_id' => $liveImportRemark->id,
        'user_id' => $user->id,
        'event' => 'created',
        'new_values' => ['message' => $liveImportRemark->message],
        'ip_address' => '127.0.0.1',
    ]);

    AuditLog::query()->create([
        'auditable_type' => TransactionRemark::class,
        'auditable_id' => $liveExportRemark->id,
        'user_id' => $user->id,
        'event' => 'created',
        'new_values' => ['message' => $liveExportRemark->message],
        'ip_address' => '127.0.0.1',
    ]);

    AuditLog::query()->create([
        'auditable_type' => ImportTransaction::class,
        'auditable_id' => $archivedImport->id,
        'user_id' => $user->id,
        'event' => 'created',
        'new_values' => ['bl_no' => $archivedImport->bl_no],
        'ip_address' => '127.0.0.1',
    ]);

    AuditLog::query()->create([
        'auditable_type' => ExportTransaction::class,
        'auditable_id' => $archivedExport->id,
        'user_id' => $user->id,
        'event' => 'created',
        'new_values' => ['bl_no' => $archivedExport->bl_no],
        'ip_address' => '127.0.0.1',
    ]);

    return [
        $liveImport,
        $liveExport,
        $archivedImport,
        $archivedExport,
        $liveImportDocument,
        $liveExportDocument,
        $archivedImportDocument,
        $archivedExportDocument,
        $liveImportRemark,
        $liveExportRemark,
        $client,
        $user,
    ];
}
