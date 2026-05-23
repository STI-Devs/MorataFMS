<?php

use App\Enums\ArchiveOrigin;
use App\Models\Client;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;

test('archive index returns year and folder summaries without document payloads', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $importer = Client::factory()->importer()->create(['name' => 'Summary Importer']);
    $shipper = Client::factory()->exporter()->create(['name' => 'Summary Exporter']);

    $importTransaction = ImportTransaction::factory()->create([
        'bl_no' => 'BL-SUMMARY-IMPORT',
        'importer_id' => $importer->id,
        'arrival_date' => '2025-03-10',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $admin->id,
    ]);
    $exportTransaction = ExportTransaction::factory()->create([
        'bl_no' => 'BL-SUMMARY-EXPORT',
        'shipper_id' => $shipper->id,
        'export_date' => '2025-03-15',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $admin->id,
    ]);

    Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $importTransaction->id,
        'type' => 'boc',
        'filename' => 'import-boc.pdf',
        'size_bytes' => 1024,
        'uploaded_by' => $admin->id,
        'created_at' => '2025-03-11 10:00:00',
    ]);
    Document::factory()->create([
        'documentable_type' => ExportTransaction::class,
        'documentable_id' => $exportTransaction->id,
        'type' => 'billing',
        'filename' => 'export-billing.pdf',
        'size_bytes' => 2048,
        'uploaded_by' => $admin->id,
        'created_at' => '2025-03-16 10:00:00',
    ]);

    $this->actingAs($admin)
        ->getJson('/api/archives')
        ->assertOk()
        ->assertJsonPath('data.0.year', 2025)
        ->assertJsonPath('data.0.imports', 1)
        ->assertJsonPath('data.0.exports', 1)
        ->assertJsonPath('data.0.file_count', 2)
        ->assertJsonPath('data.0.bl_count', 2)
        ->assertJsonPath('data.0.completed_bl_count', 0)
        ->assertJsonPath('data.0.incomplete_bl_count', 2)
        ->assertJsonPath('data.0.total_size_bytes', 3072)
        ->assertJsonPath('data.0.documents', [])
        ->assertJsonCount(2, 'data.0.folders')
        ->assertJsonPath('data.0.folders.0.month', 3)
        ->assertJsonPath('data.0.folders.0.type', 'export')
        ->assertJsonPath('data.0.folders.0.file_count', 1)
        ->assertJsonPath('data.0.folders.1.type', 'import');
});

test('archive document index returns paginated bl rows without loading every archive record', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $shipper = Client::factory()->exporter()->create(['name' => 'Paginated Exporter']);

    foreach (range(1, 30) as $index) {
        $transaction = ExportTransaction::factory()->create([
            'bl_no' => 'BL-PAGED-'.str_pad((string) $index, 3, '0', STR_PAD_LEFT),
            'shipper_id' => $shipper->id,
            'export_date' => '2025-01-'.str_pad((string) (($index % 28) + 1), 2, '0', STR_PAD_LEFT),
            'is_archive' => true,
            'archived_at' => now(),
            'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
            'assigned_user_id' => $admin->id,
        ]);

        Document::factory()->create([
            'documentable_type' => ExportTransaction::class,
            'documentable_id' => $transaction->id,
            'type' => 'billing',
            'filename' => "billing-{$index}.pdf",
            'uploaded_by' => $admin->id,
        ]);
    }

    $this->actingAs($admin)
        ->getJson('/api/archives/documents?year=2025&type=export&per_page=25')
        ->assertOk()
        ->assertJsonCount(25, 'data')
        ->assertJsonPath('meta.current_page', 1)
        ->assertJsonPath('meta.last_page', 2)
        ->assertJsonPath('meta.total', 30)
        ->assertJsonPath('data.0.type', 'export')
        ->assertJsonPath('data.0.year', 2025)
        ->assertJsonStructure([
            'data' => [
                '*' => [
                    'bl_no',
                    'client',
                    'type',
                    'year',
                    'month',
                    'documents',
                ],
            ],
            'meta' => [
                'current_page',
                'last_page',
                'per_page',
                'total',
                'from',
                'to',
            ],
        ]);

    $this->actingAs($admin)
        ->getJson('/api/archives/documents?year=2025&type=export&per_page=25&page=2')
        ->assertOk()
        ->assertJsonCount(5, 'data')
        ->assertJsonPath('meta.current_page', 2)
        ->assertJsonPath('meta.from', 26)
        ->assertJsonPath('meta.to', 30);
});

test('archive document index preserves import and export rows when both tables share ids', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $importer = Client::factory()->importer()->create(['name' => 'Shared Id Importer']);
    $shipper = Client::factory()->exporter()->create(['name' => 'Shared Id Exporter']);

    $importTransaction = ImportTransaction::factory()->create([
        'bl_no' => 'BL-ALL-IMPORT',
        'importer_id' => $importer->id,
        'arrival_date' => '2025-04-10',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $admin->id,
    ]);
    $exportTransaction = ExportTransaction::factory()->create([
        'bl_no' => 'BL-ALL-EXPORT',
        'shipper_id' => $shipper->id,
        'export_date' => '2025-04-11',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $admin->id,
    ]);

    expect($importTransaction->id)->toBe($exportTransaction->id);

    Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $importTransaction->id,
        'type' => 'boc',
        'filename' => 'all-import.pdf',
        'uploaded_by' => $admin->id,
    ]);
    Document::factory()->create([
        'documentable_type' => ExportTransaction::class,
        'documentable_id' => $exportTransaction->id,
        'type' => 'billing',
        'filename' => 'all-export.pdf',
        'uploaded_by' => $admin->id,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/archives/documents?year=2025&type=all')
        ->assertOk()
        ->assertJsonPath('meta.total', 2);

    expect(collect($response->json('data'))->pluck('bl_no')->all())
        ->toContain('BL-ALL-IMPORT', 'BL-ALL-EXPORT');
});

test('archive document index filters by search and mine access', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);
    $shipper = Client::factory()->exporter()->create(['name' => 'Searchable Exporter']);

    $ownedTransaction = ExportTransaction::factory()->create([
        'bl_no' => 'BL-MINE-SEARCH',
        'shipper_id' => $shipper->id,
        'export_date' => '2025-03-10',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $encoder->id,
    ]);
    $otherTransaction = ExportTransaction::factory()->create([
        'bl_no' => 'BL-OTHER-SEARCH',
        'shipper_id' => $shipper->id,
        'export_date' => '2025-03-11',
        'is_archive' => true,
        'archived_at' => now(),
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
        'assigned_user_id' => $otherEncoder->id,
    ]);

    Document::factory()->create([
        'documentable_type' => ExportTransaction::class,
        'documentable_id' => $ownedTransaction->id,
        'type' => 'billing',
        'filename' => 'owned-search-result.pdf',
        'uploaded_by' => $encoder->id,
    ]);
    Document::factory()->create([
        'documentable_type' => ExportTransaction::class,
        'documentable_id' => $otherTransaction->id,
        'type' => 'billing',
        'filename' => 'other-search-result.pdf',
        'uploaded_by' => $otherEncoder->id,
    ]);

    $this->actingAs($encoder)
        ->getJson('/api/archives/documents?mine=1&search=SEARCH&type=export')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.bl_no', 'BL-MINE-SEARCH')
        ->assertJsonPath('meta.total', 1);
});
