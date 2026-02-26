<?php

use App\Models\Client;
use App\Models\Country;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    // Fake S3 to prevent actual AWS calls during tests
    Storage::fake('s3');
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
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    $this->actingAs($user)->postJson('/api/archives/import', [
        'bl_no' => 'BL-ARCH-TODAY-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => now()->toDateString(),
    ])->assertCreated()
        ->assertJsonPath('data.bl_no', 'BL-ARCH-TODAY-001')
        ->assertJsonPath('data.status', 'completed'); // Archives are stored as completed
});

test('archive import is accepted when file_date is in the past', function () {
    $user = User::factory()->create(['role' => 'encoder']);
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
        ->assertJsonPath('data.status', 'completed')
        ->assertJsonPath('data.selective_color', 'yellow')
        ->assertJsonPath('data.importer.id', $client->id)
        ->assertJsonPath('data.origin_country.id', $country->id);
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
    $user = User::factory()->create(['role' => 'encoder']);
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
        ->assertJsonPath('data.status', 'completed')
        ->assertJsonPath('data.shipper.id', $client->id)
        ->assertJsonPath('data.destination_country.id', $country->id);
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

    // Import path: documents/imports/{year}/{MM-Month}/{BL-SLUG}/{stage}_{filename}_{unique}.{ext}
    $path = Document::generateS3Path(
        'App\Models\ImportTransaction',
        1,
        'boc',              // valid import stage key
        'customs-form.pdf',
        'MAEU123456789',    // BL number → slugified to MAEU123456789
        $year,
    );

    expect($path)->toStartWith("documents/imports/{$year}/{$monthPad}-{$monthName}/MAEU123456789/");
    expect($path)->toContain('boc_customs_form_');
    expect($path)->toEndWith('.pdf');

    // Ensure the unique suffix is appended (6 chars before extension)
    preg_match('/boc_customs_form_([a-zA-Z0-9]{6})\.pdf$/', $path, $matches);
    expect($matches)->toHaveCount(2, 'S3 path should contain a 6-char unique suffix');
});

test('archive export document generates correct S3 path structure', function () {
    // Export path: documents/exports/{year}/{MM-Month}/{BL-SLUG}/{stage}_{filename}_{unique}.{ext}
    $path = Document::generateS3Path(
        'App\Models\ExportTransaction',
        5,
        'bl_generation',   // valid export stage key
        'bill-of-lading.pdf',
        'MAEU-78542136',
        2024,
        false,
        3, // March
    );

    expect($path)->toStartWith('documents/exports/2024/03-March/MAEU-78542136/');
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
        false,
        6, // June
    );

    expect($path)->toStartWith('documents/imports/2023/06-June/42/');
    expect($path)->toContain('boc_document_');
});

// ─── Document Type (Stage Key) Validation ────────────────────────────────────

test('document upload rejects invalid stage key', function () {
    Storage::fake('s3');
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
    $user = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create();

    foreach (['boc', 'ppa', 'do', 'port_charges', 'releasing', 'billing'] as $stage) {
        // Each valid import stage key must be accepted
        $this->actingAs($user)->postJson('/api/documents', [
            'file' => UploadedFile::fake()->create("doc-{$stage}.pdf", 100, 'application/pdf'),
            'type' => $stage,
            'documentable_type' => 'App\Models\ImportTransaction',
            'documentable_id' => $transaction->id,
        ])->assertCreated();
    }
});

test('document upload accepts valid export stage keys', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create();

    foreach (['bl_generation', 'co', 'dccci'] as $stage) {
        // Each valid export stage key must be accepted
        $this->actingAs($user)->postJson('/api/documents', [
            'file' => UploadedFile::fake()->create("doc-{$stage}.pdf", 100, 'application/pdf'),
            'type' => $stage,
            'documentable_type' => 'App\Models\ImportTransaction',
            'documentable_id' => $transaction->id,
        ])->assertCreated();
    }
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
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    $response = $this->actingAs($user)->postJson('/api/archives/import', [
        'bl_no' => 'BL-FLAG-IMP-001',
        'selective_color' => 'green',
        'importer_id' => $client->id,
        'file_date' => '2023-06-15',
    ])->assertCreated();

    $transaction = ImportTransaction::where('bl_no', 'BL-FLAG-IMP-001')->first();
    expect($transaction->is_archive)->toBeTrue();
});

test('archive export sets is_archive flag to true and stores export_date', function () {
    $user = User::factory()->create(['role' => 'encoder']);
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

// ─── S3 Archive Prefix Routing ────────────────────────────────────────────────

test('archive documents use archives/ S3 prefix', function () {
    $path = Document::generateS3Path(
        'App\Models\ImportTransaction',
        1,
        'boc',
        'customs-form.pdf',
        'MAEU123456789',
        2023,
        true, // isArchive = true
        6, // June
    );

    expect($path)->toStartWith('archives/imports/2023/06-June/MAEU123456789/');
    expect($path)->toContain('boc_customs_form_');
    expect($path)->toEndWith('.pdf');
});

test('live documents use documents/ S3 prefix', function () {
    $path = Document::generateS3Path(
        'App\Models\ImportTransaction',
        1,
        'boc',
        'customs-form.pdf',
        'MAEU123456789',
        2026,
        false, // isArchive = false
        2, // February
    );

    expect($path)->toStartWith('documents/imports/2026/02-February/MAEU123456789/');
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
    $user = User::factory()->create(['role' => 'encoder']);
    $client = Client::factory()->importer()->create();

    // Create an archive transaction with a document (should appear)
    $archiveTx = ImportTransaction::factory()->create([
        'bl_no' => 'BL-ARCHIVE-VISIBLE',
        'importer_id' => $client->id,
        'arrival_date' => '2023-06-15',
        'status' => 'completed',
        'is_archive' => true,
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
        'status' => 'completed',
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

    expect($blNumbers)->toContain('BL-ARCHIVE-VISIBLE');
    expect($blNumbers)->not->toContain('BL-LIVE-HIDDEN');
});

