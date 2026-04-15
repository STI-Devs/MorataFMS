<?php

use App\Enums\ArchiveOrigin;
use App\Models\Client;
use App\Models\Country;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->documentDisk = config('filesystems.document_disk', 's3');

    // Fake the configured document disk to prevent actual storage calls during tests.
    Storage::fake($this->documentDisk);
});

afterEach(function () {
    Carbon::setTestNow();
});

// ─── Authentication Guards ─────────────────────────────────────────────────────

test('unauthenticated users cannot create archive imports', function () {
    $this->postJson('/api/archives/import', [])->assertUnauthorized();
});

test('unauthenticated users cannot create archive exports', function () {
    $this->postJson('/api/archives/export', [])->assertUnauthorized();
});

// ─── Import Archive: Past Date Enforcement ─────────────────────────────────────

test('archive import is rejected when file_date is in the future', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    $response = $this->actingAs($user)->postJson('/api/archives/import', [
        'bl_no' => 'BL-ARCH-FUTURE-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => now()->addDays(5)->toDateString(),
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['file_date']);

    $errors = $response->json('errors.file_date');
    expect($errors[0])->toContain('future');
});

test('archive import is rejected when file_date is exactly tomorrow', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    $this->actingAs($user)->postJson('/api/archives/import', [
        'bl_no' => 'BL-ARCH-TOMORROW-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => now()->addDay()->toDateString(),
    ])->assertUnprocessable()->assertJsonValidationErrors(['file_date']);
});

test('archive import is accepted when file_date is today', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->importer()->create();

    $this->actingAs($user)->postJson('/api/archives/import', [
        'bl_no' => 'BL-ARCH-TODAY-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => now()->toDateString(),
    ])->assertCreated()
        ->assertJsonPath('data.bl_no', 'BL-ARCH-TODAY-001')
        ->assertJsonPath('data.status', 'Completed')
        ->assertJsonPath('data.is_archive', true)
        ->assertJsonPath('data.archived_by_id', $user->id)
        ->assertJsonPath('data.archive_origin', ArchiveOrigin::DirectArchiveUpload->value); // Archives are stored as completed
});

test('archive import is accepted when file_date is in the past', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->importer()->create();
    $country = Country::factory()->importOrigin()->create();

    $this->actingAs($user)->postJson('/api/archives/import', [
        'customs_ref_no' => 'ARCH-IMP-2023-001',
        'bl_no' => 'BL-ARCH-PAST-001',
        'selective_color' => 'yellow',
        'importer_id' => $client->id,
        'origin_country_id' => $country->id,
        'file_date' => '2023-06-15',
        'notes' => 'Legacy archive (2023)',
    ])->assertCreated()
        ->assertJsonPath('data.bl_no', 'BL-ARCH-PAST-001')
        ->assertJsonPath('data.status', 'Completed')
        ->assertJsonPath('data.selective_color', 'yellow')
        ->assertJsonPath('data.importer.id', $client->id)
        ->assertJsonPath('data.origin_country.id', $country->id)
        ->assertJsonPath('data.archive_origin', ArchiveOrigin::DirectArchiveUpload->value);
});

// ─── Import Archive: Required Fields ──────────────────────────────────────────

test('archive import fails without bl_no', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    $this->actingAs($user)->postJson('/api/archives/import', [
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => '2024-01-10',
    ])->assertUnprocessable()->assertJsonValidationErrors(['bl_no']);
});

test('archive import fails without selective_color', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    $this->actingAs($user)->postJson('/api/archives/import', [
        'bl_no' => 'BL-NOCOLOR-001',
        'importer_id' => $client->id,
        'file_date' => '2024-01-10',
    ])->assertUnprocessable()->assertJsonValidationErrors(['selective_color']);
});

test('archive import fails without importer_id', function () {
    $user = User::factory()->create(['role' => 'encoder']);

    $this->actingAs($user)->postJson('/api/archives/import', [
        'bl_no' => 'BL-NOIMPORT-001',
        'selective_color' => 'green',
        'file_date' => '2024-01-10',
    ])->assertUnprocessable()->assertJsonValidationErrors(['importer_id']);
});

test('archive import fails with duplicate bl_no', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    ImportTransaction::factory()->create(['bl_no' => 'BL-DUPE-ARCH-001']);

    $this->actingAs($user)->postJson('/api/archives/import', [
        'bl_no' => 'BL-DUPE-ARCH-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => '2024-01-10',
    ])->assertUnprocessable()->assertJsonValidationErrors(['bl_no']);
});

test('archive import fails with duplicate customs reference number', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    ImportTransaction::factory()->create(['customs_ref_no' => 'ARCH-DUPE-REF-001']);

    $this->actingAs($user)->postJson('/api/archives/import', [
        'customs_ref_no' => 'ARCH-DUPE-REF-001',
        'bl_no' => 'BL-DUPE-ARCH-REF-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => '2024-01-10',
    ])->assertUnprocessable()->assertJsonValidationErrors(['customs_ref_no']);
});

test('archive import bypasses the generic max request size middleware', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    $this->actingAs($user)->postJson('/api/archives/import', [
        'bl_no' => 'BL-ARCH-LARGE-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => '2024-01-10',
        'notes' => str_repeat('A', 70 * 1024),
    ])->assertUnprocessable()->assertJsonValidationErrors(['notes']);
});

// ─── Export Archive: Past Date Enforcement ────────────────────────────────────

test('archive export is rejected when file_date is in the future', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $this->actingAs($user)->postJson('/api/archives/export', [
        'bl_no' => 'BL-EXP-ARCH-FUTURE',
        'shipper_id' => $client->id,
        'destination_country_id' => $country->id,
        'file_date' => now()->addDays(3)->toDateString(),
    ])->assertUnprocessable()->assertJsonValidationErrors(['file_date']);
});

test('archive export is accepted when file_date is in the past', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $this->actingAs($user)->postJson('/api/archives/export', [
        'bl_no' => 'BL-EXP-ARCH-PAST-001',
        'vessel' => 'MV LEGACY STAR',
        'shipper_id' => $client->id,
        'destination_country_id' => $country->id,
        'file_date' => '2024-03-20',
        'notes' => 'Legacy archive (2024)',
    ])->assertCreated()
        ->assertJsonPath('data.bl_no', 'BL-EXP-ARCH-PAST-001')
        ->assertJsonPath('data.status', 'Completed')
        ->assertJsonPath('data.shipper.id', $client->id)
        ->assertJsonPath('data.destination_country.id', $country->id)
        ->assertJsonPath('data.archive_origin', ArchiveOrigin::DirectArchiveUpload->value);
});

// ─── Export Archive: Required Fields ──────────────────────────────────────────

test('archive export fails without bl_no', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $this->actingAs($user)->postJson('/api/archives/export', [
        'shipper_id' => $client->id,
        'destination_country_id' => $country->id,
        'file_date' => '2024-01-10',
    ])->assertUnprocessable()->assertJsonValidationErrors(['bl_no']);
});

test('archive export fails without shipper_id', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $country = Country::factory()->create();

    $this->actingAs($user)->postJson('/api/archives/export', [
        'bl_no' => 'BL-NOSHIP-001',
        'destination_country_id' => $country->id,
        'file_date' => '2024-01-10',
    ])->assertUnprocessable()->assertJsonValidationErrors(['shipper_id']);
});

test('archive export fails without destination_country_id', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->exporter()->create();

    $this->actingAs($user)->postJson('/api/archives/export', [
        'bl_no' => 'BL-NOCOUNTRY-001',
        'shipper_id' => $client->id,
        'file_date' => '2024-01-10',
    ])->assertUnprocessable()->assertJsonValidationErrors(['destination_country_id']);
});

test('archive export fails with duplicate bl_no', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    ExportTransaction::factory()->create(['bl_no' => 'BL-EXP-DUPE-001']);

    $this->actingAs($user)->postJson('/api/archives/export', [
        'bl_no' => 'BL-EXP-DUPE-001',
        'shipper_id' => $client->id,
        'destination_country_id' => $country->id,
        'file_date' => '2024-01-10',
    ])->assertUnprocessable()->assertJsonValidationErrors(['bl_no']);
});

// ─── S3 Path Structure ────────────────────────────────────────────────────────

test('archive import document generates correct S3 path structure', function () {
    $year = now()->year;
    $monthPad = str_pad(now()->month, 2, '0', STR_PAD_LEFT);
    $monthName = date('F');

    // Import path: transaction-documents/imports/{year}/{period-folder}/{BL-SLUG}/{stage}_{filename}_{unique}.{ext}
    $path = Document::generateS3Path(
        'App\Models\ImportTransaction',
        1,
        'boc',              // valid import stage key
        'customs-form.pdf',
        'MAEU123456789',    // BL number → slugified to MAEU123456789
        $year,
    );

    expect($path)->toStartWith("transaction-documents/imports/{$year}/month-{$monthPad}-{$monthName}/MAEU123456789/");
    expect($path)->toContain('boc_customs_form_');
    expect($path)->toEndWith('.pdf');

    // Ensure the unique suffix is appended (6 chars before extension)
    preg_match('/boc_customs_form_([a-zA-Z0-9]{6})\.pdf$/', $path, $matches);
    expect($matches)->toHaveCount(2, 'S3 path should contain a 6-char unique suffix');
});

test('archive export document generates correct S3 path structure', function () {
    // Export path: transaction-documents/exports/{year}/{period-folder}/{BL-SLUG}/{stage}_{filename}_{unique}.{ext}
    $path = Document::generateS3Path(
        'App\Models\ExportTransaction',
        5,
        'bl_generation',   // valid export stage key
        'bill-of-lading.pdf',
        'MAEU-78542136',
        2024,
        3, // March
    );

    expect($path)->toStartWith('transaction-documents/exports/2024/month-03-March/MAEU-78542136/');
    expect($path)->toContain('bl_generation_bill_of_lading_');
    expect($path)->toEndWith('.pdf');
});

test('S3 path falls back to documentable_id when no BL number given', function () {
    $path = Document::generateS3Path(
        'App\Models\ImportTransaction',
        42,
        'boc',
        'document.pdf',
        '',   // no BL — must fall back to ID
        2023,
        6, // June
    );

    expect($path)->toStartWith('transaction-documents/imports/2023/month-06-June/42/');
    expect($path)->toContain('boc_document_');
});

// ─── Document Type (Stage Key) Validation ────────────────────────────────────

test('document upload rejects invalid stage key', function () {
    Storage::fake($this->documentDisk);
    $user = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create();

    $this->actingAs($user)->postJson('/api/documents', [
        'file' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
        'type' => 'invalid_stage_key', // Not a valid stage key
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $transaction->id,
    ])->assertUnprocessable()->assertJsonValidationErrors(['type']);
});

test('document upload accepts valid import stage keys', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $transaction = ImportTransaction::factory()->create();

    foreach (['boc', 'bonds', 'ppa', 'do', 'port_charges', 'releasing', 'billing', 'others'] as $stage) {
        $this->actingAs($user)->postJson('/api/documents', [
            'file' => UploadedFile::fake()->create("doc-{$stage}.pdf", 100, 'application/pdf'),
            'type' => $stage,
            'documentable_type' => 'App\Models\ImportTransaction',
            'documentable_id' => $transaction->id,
        ])->assertCreated();
    }
});

test('document upload rejects phytosanitary for import transactions', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $transaction = ImportTransaction::factory()->create();

    $this->actingAs($user)->postJson('/api/documents', [
        'file' => UploadedFile::fake()->create('doc-phytosanitary.pdf', 100, 'application/pdf'),
        'type' => 'phytosanitary',
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $transaction->id,
    ])->assertUnprocessable()->assertJsonValidationErrors(['type']);
});

test('document upload accepts valid export stage keys', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $transaction = ExportTransaction::factory()->create();

    foreach (['boc', 'bl_generation', 'phytosanitary', 'co', 'cil', 'dccci', 'billing', 'others'] as $stage) {
        $this->actingAs($user)->postJson('/api/documents', [
            'file' => UploadedFile::fake()->create("doc-{$stage}.pdf", 100, 'application/pdf'),
            'type' => $stage,
            'documentable_type' => ExportTransaction::class,
            'documentable_id' => $transaction->id,
        ])->assertCreated();
    }
});

test('document upload rejects export-only stage keys for import transactions', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $transaction = ImportTransaction::factory()->create();

    $this->actingAs($user)->postJson('/api/documents', [
        'file' => UploadedFile::fake()->create('doc-bl-generation.pdf', 100, 'application/pdf'),
        'type' => 'bl_generation',
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $transaction->id,
    ])->assertUnprocessable()->assertJsonValidationErrors(['type']);
});

test('document upload rejects import-only stage keys for export transactions', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $transaction = ExportTransaction::factory()->create();

    $this->actingAs($user)->postJson('/api/documents', [
        'file' => UploadedFile::fake()->create('doc-ppa.pdf', 100, 'application/pdf'),
        'type' => 'ppa',
        'documentable_type' => ExportTransaction::class,
        'documentable_id' => $transaction->id,
    ])->assertUnprocessable()->assertJsonValidationErrors(['type']);
});

test('archive import rejects export-only document stages', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->importer()->create();

    $this->actingAs($user)
        ->withHeader('Accept', 'application/json')
        ->post('/api/archives/import', [
            'bl_no' => 'BL-ARCH-INVALID-STAGE-IMP',
            'selective_color' => 'green',
            'importer_id' => $client->id,
            'file_date' => '2023-06-15',
            'documents' => [
                [
                    'file' => UploadedFile::fake()->create('bl-generation.pdf', 100, 'application/pdf'),
                    'stage' => 'bl_generation',
                ],
            ],
        ])->assertUnprocessable()->assertJsonValidationErrors(['documents.0.stage']);
});

test('archive export rejects import-only document stages', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $this->actingAs($user)
        ->withHeader('Accept', 'application/json')
        ->post('/api/archives/export', [
            'bl_no' => 'BL-ARCH-INVALID-STAGE-EXP',
            'shipper_id' => $client->id,
            'destination_country_id' => $country->id,
            'file_date' => '2024-03-20',
            'documents' => [
                [
                    'file' => UploadedFile::fake()->create('ppa.pdf', 100, 'application/pdf'),
                    'stage' => 'ppa',
                ],
            ],
        ])->assertUnprocessable()->assertJsonValidationErrors(['documents.0.stage']);
});

// ─── Regular Encoding: Future Dates Still Allowed ─────────────────────────────

test('regular import encoding still accepts future arrival_date (vessel ETA)', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    // Encoders enter future ETAs for active shipments — this must remain allowed
    $this->actingAs($user)->postJson('/api/import-transactions', [
        'customs_ref_no' => 'REF-ETA-001',
        'bl_no' => 'BL-ETA-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'arrival_date' => now()->addDays(10)->toDateString(),
    ])->assertCreated();
});

// ─── is_archive Flag ──────────────────────────────────────────────────────────

test('archive import sets is_archive flag to true', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->importer()->create();

    $response = $this->actingAs($user)->postJson('/api/archives/import', [
        'bl_no' => 'BL-FLAG-IMP-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => '2023-06-15',
    ])->assertCreated();

    $transaction = ImportTransaction::where('bl_no', 'BL-FLAG-IMP-001')->first();
    expect($transaction->is_archive)->toBeTrue();
    expect($transaction->archived_at)->not->toBeNull();
    expect($transaction->archived_by)->toBe($user->id);
    expect($transaction->archive_origin)->toBe(ArchiveOrigin::DirectArchiveUpload);
});

test('archive export sets is_archive flag to true and stores export_date', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $this->actingAs($user)->postJson('/api/archives/export', [
        'bl_no' => 'BL-FLAG-EXP-001',
        'shipper_id' => $client->id,
        'destination_country_id' => $country->id,
        'file_date' => '2024-03-20',
    ])->assertCreated();

    $transaction = ExportTransaction::where('bl_no', 'BL-FLAG-EXP-001')->first();
    expect($transaction->is_archive)->toBeTrue();
    expect($transaction->export_date->toDateString())->toBe('2024-03-20');
    expect($transaction->archived_at)->not->toBeNull();
    expect($transaction->archived_by)->toBe($user->id);
    expect($transaction->archive_origin)->toBe(ArchiveOrigin::DirectArchiveUpload);
});

test('regular import encoding does NOT set is_archive', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    $this->actingAs($user)->postJson('/api/import-transactions', [
        'customs_ref_no' => 'REF-LIVE-001',
        'bl_no' => 'BL-LIVE-IMP-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'arrival_date' => now()->addDays(5)->toDateString(),
    ])->assertCreated();

    $transaction = ImportTransaction::where('bl_no', 'BL-LIVE-IMP-001')->first();
    expect($transaction->is_archive)->toBeFalse();
});

// ─── Stable S3 Root Routing ───────────────────────────────────────────────────

test('archive documents use the stable transaction-documents S3 root', function () {
    $path = Document::generateS3Path(
        'App\Models\ImportTransaction',
        1,
        'boc',
        'customs-form.pdf',
        'MAEU123456789',
        2023,
        6, // June
    );

    expect($path)->toStartWith('transaction-documents/imports/2023/month-06-June/MAEU123456789/');
    expect($path)->toContain('boc_customs_form_');
    expect($path)->toEndWith('.pdf');
});

test('live documents use the same stable transaction-documents S3 root', function () {
    $path = Document::generateS3Path(
        'App\Models\ImportTransaction',
        1,
        'boc',
        'customs-form.pdf',
        'MAEU123456789',
        2026,
        2, // February
    );

    expect($path)->toStartWith('transaction-documents/imports/2026/month-02-February/MAEU123456789/');
});

// ─── BL Format Validation ─────────────────────────────────────────────────────

test('archive import rejects BL numbers shorter than 4 characters', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    $this->actingAs($user)->postJson('/api/archives/import', [
        'bl_no' => 'AB',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => '2023-01-10',
    ])->assertUnprocessable()->assertJsonValidationErrors(['bl_no']);
});

test('archive import rejects BL numbers with special characters', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    $this->actingAs($user)->postJson('/api/archives/import', [
        'bl_no' => 'BL@#$%^&',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => '2023-01-10',
    ])->assertUnprocessable()->assertJsonValidationErrors(['bl_no']);
});

// ─── File Date Range Validation ───────────────────────────────────────────────

test('archive import rejects file_date before year 2000', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    $this->actingAs($user)->postJson('/api/archives/import', [
        'bl_no' => 'BL-OLD-IMP-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => '1999-12-31',
    ])->assertUnprocessable()->assertJsonValidationErrors(['file_date']);
});

test('archive export rejects file_date before year 2000', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $this->actingAs($user)->postJson('/api/archives/export', [
        'bl_no' => 'BL-OLD-EXP-001',
        'shipper_id' => $client->id,
        'destination_country_id' => $country->id,
        'file_date' => '1998-06-15',
    ])->assertUnprocessable()->assertJsonValidationErrors(['file_date']);
});

// ─── Archive Listing ──────────────────────────────────────────────────────────

test('archive listing only returns transactions with is_archive flag', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->importer()->create();

    // Create an archive transaction with a document (should appear)
    $archiveTx = ImportTransaction::factory()->create([
        'bl_no' => 'BL-ARCHIVE-VISIBLE',
        'importer_id' => $client->id,
        'arrival_date' => '2023-06-15',
        'status' => 'Completed',
        'is_archive' => true,
        'archived_at' => '2026-04-06 04:39:14',
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
    ]);
    // Attach a document so it appears in the flattened documents list
    Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $archiveTx->id,
        'type' => 'boc',
    ]);

    // Create a live completed transaction with a document (should NOT appear)
    $liveTx = ImportTransaction::factory()->create([
        'bl_no' => 'BL-LIVE-HIDDEN',
        'importer_id' => $client->id,
        'arrival_date' => '2023-06-15',
        'status' => 'Completed',
        'is_archive' => false,
    ]);
    Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $liveTx->id,
        'type' => 'boc',
    ]);

    $response = $this->actingAs($user)->getJson('/api/archives')->assertOk();

    $allDocs = collect($response->json('data'))->pluck('documents')->flatten(1);
    $blNumbers = $allDocs->pluck('bl_no')->toArray();
    $archiveDocument = $allDocs->firstWhere('bl_no', 'BL-ARCHIVE-VISIBLE');

    expect($blNumbers)->toContain('BL-ARCHIVE-VISIBLE');
    expect($blNumbers)->not->toContain('BL-LIVE-HIDDEN');
    expect($archiveDocument['archive_origin'] ?? null)->toBe(ArchiveOrigin::DirectArchiveUpload->value);
    expect($archiveDocument['archived_at'] ?? null)->not->toBeNull();
});

test('encoder my archive listing only returns documents uploaded by the current user', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);
    $admin = User::factory()->create(['role' => 'admin']);
    $importer = Client::factory()->importer()->create();
    $shipper = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $ownedImport = ImportTransaction::factory()->create([
        'bl_no' => 'BL-MY-ARCHIVE-001',
        'importer_id' => $importer->id,
        'arrival_date' => '2024-06-15',
        'status' => 'Completed',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $encoder->id,
    ]);
    $ownedDocument = Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $ownedImport->id,
        'type' => 'boc',
        'uploaded_by' => $encoder->id,
    ]);

    $otherImport = ImportTransaction::factory()->create([
        'bl_no' => 'BL-OTHER-ARCHIVE-001',
        'importer_id' => $importer->id,
        'arrival_date' => '2024-06-16',
        'status' => 'Completed',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $otherEncoder->id,
    ]);
    Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $otherImport->id,
        'type' => 'boc',
        'uploaded_by' => $otherEncoder->id,
    ]);

    $adminExport = ExportTransaction::factory()->create([
        'bl_no' => 'BL-ADMIN-ARCHIVE-001',
        'shipper_id' => $shipper->id,
        'destination_country_id' => $country->id,
        'export_date' => '2024-06-17',
        'status' => 'Completed',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $admin->id,
    ]);
    Document::factory()->create([
        'documentable_type' => ExportTransaction::class,
        'documentable_id' => $adminExport->id,
        'type' => 'boc',
        'uploaded_by' => $admin->id,
    ]);

    $response = $this->actingAs($encoder)
        ->getJson('/api/archives?mine=1')
        ->assertOk();

    $documents = collect($response->json('data'))
        ->pluck('documents')
        ->flatten(1)
        ->values();

    expect($documents)->toHaveCount(1);
    expect($documents->pluck('id')->all())->toBe([$ownedDocument->id]);
    expect($documents->pluck('bl_no')->all())->toBe(['BL-MY-ARCHIVE-001']);
    expect($documents->pluck('uploader.id')->all())->toBe([$encoder->id]);
});

test('encoder cannot access the full archive listing without the mine filter', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);

    $this->actingAs($encoder)
        ->getJson('/api/archives')
        ->assertForbidden();
});

test('admin can access archive documents uploaded by every user', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $encoder = User::factory()->create(['role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);
    $importer = Client::factory()->importer()->create();
    $shipper = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $encoderImport = ImportTransaction::factory()->create([
        'bl_no' => 'BL-ADMIN-VIEW-IMP-001',
        'importer_id' => $importer->id,
        'arrival_date' => '2024-07-10',
        'status' => 'Completed',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $encoder->id,
    ]);
    Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $encoderImport->id,
        'type' => 'boc',
        'uploaded_by' => $encoder->id,
    ]);

    $otherExport = ExportTransaction::factory()->create([
        'bl_no' => 'BL-ADMIN-VIEW-EXP-001',
        'shipper_id' => $shipper->id,
        'destination_country_id' => $country->id,
        'export_date' => '2024-07-11',
        'status' => 'Completed',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $otherEncoder->id,
    ]);
    Document::factory()->create([
        'documentable_type' => ExportTransaction::class,
        'documentable_id' => $otherExport->id,
        'type' => 'boc',
        'uploaded_by' => $otherEncoder->id,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/archives')
        ->assertOk();

    $documents = collect($response->json('data'))
        ->pluck('documents')
        ->flatten(1);

    expect($documents->pluck('bl_no')->all())
        ->toContain('BL-ADMIN-VIEW-IMP-001', 'BL-ADMIN-VIEW-EXP-001');
});

test('archive import stores uploaded archive documents', function () {
    Storage::fake($this->documentDisk);

    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->importer()->create();

    $response = $this->actingAs($user)->post('/api/archives/import', [
        'bl_no' => 'BL-ARCH-DOC-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => '2023-06-15',
        'documents' => [
            [
                'file' => UploadedFile::fake()->create('archive-boc.pdf', 100, 'application/pdf'),
                'stage' => 'boc',
            ],
        ],
    ]);

    $response->assertCreated();

    $transaction = ImportTransaction::where('bl_no', 'BL-ARCH-DOC-001')->first();
    expect($transaction)->not->toBeNull();

    $document = Document::where('documentable_type', ImportTransaction::class)
        ->where('documentable_id', $transaction->id)
        ->latest()
        ->first();

    expect($document)->not->toBeNull();
    Storage::disk($this->documentDisk)->assertExists($document->path);
});

test('archive import rejects more than 10 uploaded documents in a single stage', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->importer()->create();

    $documents = array_map(
        fn (int $index) => [
            'file' => UploadedFile::fake()->create("archive-import-{$index}.pdf", 100, 'application/pdf'),
            'stage' => 'boc',
        ],
        range(1, 11),
    );

    $response = $this->actingAs($user)->post('/api/archives/import', [
        'bl_no' => 'BL-ARCH-TOO-MANY-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => '2023-06-15',
        'documents' => $documents,
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors(['documents']);
    $response->assertJsonPath('errors.documents.0', 'You can upload up to 10 files for the BOC Document Processing stage.');
});

test('archive export rejects more than 10 uploaded documents in a single stage', function () {
    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $documents = array_map(
        fn (int $index) => [
            'file' => UploadedFile::fake()->create("archive-export-{$index}.pdf", 100, 'application/pdf'),
            'stage' => 'boc',
        ],
        range(1, 11),
    );

    $response = $this->actingAs($user)->post('/api/archives/export', [
        'bl_no' => 'BL-ARCH-TOO-MANY-EXP-001',
        'shipper_id' => $client->id,
        'destination_country_id' => $country->id,
        'file_date' => '2023-06-15',
        'documents' => $documents,
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors(['documents']);
    $response->assertJsonPath('errors.documents.0', 'You can upload up to 10 files for the BOC Document Processing stage.');
});

test('archive import accepts more than 10 uploaded documents when they are split across stages', function () {
    Storage::fake($this->documentDisk);

    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->importer()->create();

    $documents = [
        ...array_map(
            fn (int $index) => [
                'file' => UploadedFile::fake()->create("archive-import-boc-{$index}.pdf", 100, 'application/pdf'),
                'stage' => 'boc',
            ],
            range(1, 6),
        ),
        ...array_map(
            fn (int $index) => [
                'file' => UploadedFile::fake()->create("archive-import-others-{$index}.pdf", 100, 'application/pdf'),
                'stage' => 'others',
            ],
            range(1, 6),
        ),
    ];

    $this->actingAs($user)->post('/api/archives/import', [
        'bl_no' => 'BL-ARCH-STAGE-SPLIT-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => '2023-06-15',
        'documents' => $documents,
    ])->assertCreated();

    $transaction = ImportTransaction::where('bl_no', 'BL-ARCH-STAGE-SPLIT-001')->first();

    expect($transaction)->not->toBeNull();
    expect(Document::where('documentable_type', ImportTransaction::class)
        ->where('documentable_id', $transaction?->id)
        ->count())->toBe(12);
});

test('archive export accepts more than 10 uploaded documents when they are split across stages', function () {
    Storage::fake($this->documentDisk);

    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $documents = [
        ...array_map(
            fn (int $index) => [
                'file' => UploadedFile::fake()->create("archive-export-boc-{$index}.pdf", 100, 'application/pdf'),
                'stage' => 'boc',
            ],
            range(1, 6),
        ),
        ...array_map(
            fn (int $index) => [
                'file' => UploadedFile::fake()->create("archive-export-others-{$index}.pdf", 100, 'application/pdf'),
                'stage' => 'others',
            ],
            range(1, 6),
        ),
    ];

    $this->actingAs($user)->post('/api/archives/export', [
        'bl_no' => 'BL-ARCH-STAGE-SPLIT-EXP-001',
        'shipper_id' => $client->id,
        'destination_country_id' => $country->id,
        'file_date' => '2023-06-15',
        'documents' => $documents,
    ])->assertCreated();

    $transaction = ExportTransaction::where('bl_no', 'BL-ARCH-STAGE-SPLIT-EXP-001')->first();

    expect($transaction)->not->toBeNull();
    expect(Document::where('documentable_type', ExportTransaction::class)
        ->where('documentable_id', $transaction?->id)
        ->count())->toBe(12);
});

test('archive import rejects files for optional stages marked as not applicable', function (
    string $stage,
    string $filename,
    string $expectedMessage,
) {
    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->importer()->create();

    $response = $this->actingAs($user)->post('/api/archives/import', [
        'bl_no' => 'BL-ARCH-NA-IMP-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => '2023-06-15',
        'not_applicable_stages' => [$stage],
        'documents' => [
            [
                'file' => UploadedFile::fake()->create($filename, 100, 'application/pdf'),
                'stage' => $stage,
            ],
        ],
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors(['not_applicable_stages']);
    $response->assertJsonPath(
        'errors.not_applicable_stages.0',
        $expectedMessage,
    );
})->with([
    'bonds' => ['bonds', 'archive-bonds.pdf', 'You cannot upload files for the BONDS stage while it is marked as not applicable.'],
    'ppa' => ['ppa', 'archive-ppa.pdf', 'You cannot upload files for the Payment for PPA Charges stage while it is marked as not applicable.'],
    'port charges' => ['port_charges', 'archive-port-charges.pdf', 'You cannot upload files for the Payment for Port Charges stage while it is marked as not applicable.'],
]);

test('archive export rejects files for optional stages marked as not applicable', function (
    string $stage,
    string $filename,
    string $expectedMessage,
) {
    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $response = $this->actingAs($user)->post('/api/archives/export', [
        'bl_no' => 'BL-ARCH-NA-EXP-001',
        'shipper_id' => $client->id,
        'destination_country_id' => $country->id,
        'file_date' => '2023-06-15',
        'not_applicable_stages' => [$stage],
        'documents' => [
            [
                'file' => UploadedFile::fake()->create($filename, 100, 'application/pdf'),
                'stage' => $stage,
            ],
        ],
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors(['not_applicable_stages']);
    $response->assertJsonPath(
        'errors.not_applicable_stages.0',
        $expectedMessage,
    );
})->with([
    'phytosanitary certificates' => ['phytosanitary', 'archive-phytosanitary.pdf', 'You cannot upload files for the Phytosanitary Certificates stage while it is marked as not applicable.'],
    'co application' => ['co', 'archive-co.pdf', 'You cannot upload files for the CO Application stage while it is marked as not applicable.'],
    'dccci printing' => ['dccci', 'archive-dccci.pdf', 'You cannot upload files for the DCCCI Printing stage while it is marked as not applicable.'],
]);

test('archive import rollback deletes the created transaction and uploaded documents', function () {
    Storage::fake($this->documentDisk);

    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    $transaction = ImportTransaction::factory()->create([
        'bl_no' => 'BL-ARCH-ROLLBACK-IMP-001',
        'importer_id' => $client->id,
        'arrival_date' => '2023-06-15',
        'status' => 'Completed',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $user->id,
        'archived_by' => $user->id,
    ]);

    $document = Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $transaction->id,
        'uploaded_by' => $user->id,
        'type' => 'boc',
        'path' => 'transaction-documents/imports/2023/month-06-June/BL-ARCH-ROLLBACK-IMP-001/boc_test.pdf',
    ]);

    Storage::disk($this->documentDisk)->put($document->path, 'rollback');

    $this->actingAs($user)
        ->deleteJson("/api/archives/import/{$transaction->id}")
        ->assertNoContent();

    expect(ImportTransaction::query()->whereKey($transaction->id)->exists())->toBeFalse();
    expect(Document::query()->whereKey($document->id)->exists())->toBeFalse();
    Storage::disk($this->documentDisk)->assertMissing($document->path);
});

test('archive export rollback deletes the created transaction and uploaded documents', function () {
    Storage::fake($this->documentDisk);

    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $transaction = ExportTransaction::factory()->create([
        'bl_no' => 'BL-ARCH-ROLLBACK-EXP-001',
        'shipper_id' => $client->id,
        'destination_country_id' => $country->id,
        'export_date' => '2023-06-15',
        'status' => 'Completed',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $user->id,
        'archived_by' => $user->id,
    ]);

    $document = Document::factory()->create([
        'documentable_type' => ExportTransaction::class,
        'documentable_id' => $transaction->id,
        'uploaded_by' => $user->id,
        'type' => 'boc',
        'path' => 'transaction-documents/exports/2023/month-06-June/BL-ARCH-ROLLBACK-EXP-001/boc_test.pdf',
    ]);

    Storage::disk($this->documentDisk)->put($document->path, 'rollback');

    $this->actingAs($user)
        ->deleteJson("/api/archives/export/{$transaction->id}")
        ->assertNoContent();

    expect(ExportTransaction::query()->whereKey($transaction->id)->exists())->toBeFalse();
    expect(Document::query()->whereKey($document->id)->exists())->toBeFalse();
    Storage::disk($this->documentDisk)->assertMissing($document->path);
});

test('archive import stays completed when documents are uploaded after creation', function () {
    Storage::fake($this->documentDisk);

    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    $response = $this->actingAs($user)->postJson('/api/archives/import', [
        'bl_no' => 'BL-ARCH-LATE-UPLOAD-IMP-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => '2023-06-15',
    ])->assertCreated();

    $transactionId = $response->json('data.id');

    $this->actingAs($user)->postJson('/api/documents', [
        'file' => UploadedFile::fake()->create('archive-boc.pdf', 100, 'application/pdf'),
        'type' => 'boc',
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $transactionId,
    ])->assertCreated();

    expect(ImportTransaction::find($transactionId)?->status->value)->toBe('Completed');
});

test('archive export stays completed when documents are uploaded after creation', function () {
    Storage::fake($this->documentDisk);

    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->exporter()->create();
    $country = Country::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/archives/export', [
        'bl_no' => 'BL-ARCH-LATE-UPLOAD-EXP-001',
        'shipper_id' => $client->id,
        'destination_country_id' => $country->id,
        'file_date' => '2023-06-15',
    ])->assertCreated();

    $transactionId = $response->json('data.id');

    $this->actingAs($user)->postJson('/api/documents', [
        'file' => UploadedFile::fake()->create('archive-boc.pdf', 100, 'application/pdf'),
        'type' => 'boc',
        'documentable_type' => ExportTransaction::class,
        'documentable_id' => $transactionId,
    ])->assertCreated();

    expect(ExportTransaction::find($transactionId)?->status->value)->toBe('Completed');
});

test('archive document uploads keep the archive file date month in S3 paths', function () {
    Carbon::setTestNow('2026-04-06 04:39:14');
    Storage::fake($this->documentDisk);

    $user = User::factory()->create(['role' => 'admin']);
    $client = Client::factory()->importer()->create();

    $this->actingAs($user)->post('/api/archives/import', [
        'bl_no' => 'BL-ARCH-DATE-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => '2023-06-15',
        'documents' => [
            [
                'file' => UploadedFile::fake()->create('archive-boc.pdf', 100, 'application/pdf'),
                'stage' => 'boc',
            ],
        ],
    ])->assertCreated();

    $transaction = ImportTransaction::where('bl_no', 'BL-ARCH-DATE-001')->first();
    $document = Document::where('documentable_type', ImportTransaction::class)
        ->where('documentable_id', $transaction?->id)
        ->latest()
        ->first();

    expect($document?->path)->toStartWith('transaction-documents/imports/2023/month-06-June/BL-ARCH-DATE-001/');
});
