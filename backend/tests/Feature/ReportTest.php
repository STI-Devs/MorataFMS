<?php

use App\Enums\ArchiveOrigin;
use App\Models\Client;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;

test('admin can view monthly report counts for live and archived-from-live transactions only', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $importer = Client::factory()->importer()->create();
    $shipper = Client::factory()->exporter()->create();

    ImportTransaction::factory()->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-03-02 09:00:00',
        'updated_at' => '2026-03-04 09:00:00',
        'is_archive' => false,
    ]);

    ExportTransaction::factory()->create([
        'shipper_id' => $shipper->id,
        'created_at' => '2026-03-03 09:00:00',
        'updated_at' => '2026-03-05 09:00:00',
        'is_archive' => false,
    ]);

    ImportTransaction::factory()->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-03-01 09:00:00',
        'updated_at' => '2026-03-05 09:00:00',
        'is_archive' => true,
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
    ]);

    ImportTransaction::factory()->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-03-06 09:00:00',
        'updated_at' => '2026-03-08 09:00:00',
        'is_archive' => true,
        'archive_origin' => ArchiveOrigin::ArchivedFromLive,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/reports/monthly?year=2026')
        ->assertOk();

    $march = collect($response->json('months'))->firstWhere('month', 3);

    expect($march['imports'])->toBe(2);
    expect($march['exports'])->toBe(1);
    expect($response->json('total_imports'))->toBe(2);
    expect($response->json('total_exports'))->toBe(1);
});

test('monthly report excludes transactions outside the requested year boundaries', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $importer = Client::factory()->importer()->create();
    $shipper = Client::factory()->exporter()->create();

    ImportTransaction::factory()->create([
        'importer_id' => $importer->id,
        'created_at' => '2025-12-31 23:59:59',
        'updated_at' => '2026-01-02 09:00:00',
        'is_archive' => false,
    ]);

    ImportTransaction::factory()->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-01-01 00:00:00',
        'updated_at' => '2026-01-03 09:00:00',
        'is_archive' => false,
    ]);

    ExportTransaction::factory()->create([
        'shipper_id' => $shipper->id,
        'created_at' => '2026-12-31 23:59:59',
        'updated_at' => '2027-01-02 09:00:00',
        'is_archive' => false,
    ]);

    ExportTransaction::factory()->create([
        'shipper_id' => $shipper->id,
        'created_at' => '2027-01-01 00:00:00',
        'updated_at' => '2027-01-03 09:00:00',
        'is_archive' => false,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/reports/monthly?year=2026')
        ->assertOk();

    $january = collect($response->json('months'))->firstWhere('month', 1);
    $december = collect($response->json('months'))->firstWhere('month', 12);

    expect($january['imports'])->toBe(1);
    expect($december['exports'])->toBe(1);
    expect($response->json('total_imports'))->toBe(1);
    expect($response->json('total_exports'))->toBe(1);
});

test('client report merges import and export counts by period', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $importer = Client::factory()->importer()->create(['name' => 'Atlas Imports']);
    $shipper = Client::factory()->exporter()->create(['name' => 'Beacon Exports']);

    ImportTransaction::factory()->count(2)->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-03-02 09:00:00',
        'updated_at' => '2026-03-04 09:00:00',
        'is_archive' => false,
    ]);

    ExportTransaction::factory()->create([
        'shipper_id' => $shipper->id,
        'created_at' => '2026-03-03 09:00:00',
        'updated_at' => '2026-03-05 09:00:00',
        'is_archive' => false,
    ]);

    ImportTransaction::factory()->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-03-04 09:00:00',
        'updated_at' => '2026-03-06 09:00:00',
        'is_archive' => true,
        'archive_origin' => ArchiveOrigin::ArchivedFromLive,
    ]);

    ExportTransaction::factory()->create([
        'shipper_id' => $shipper->id,
        'created_at' => '2026-03-04 09:00:00',
        'updated_at' => '2026-03-06 09:00:00',
        'is_archive' => true,
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/reports/clients?year=2026&month=3')
        ->assertOk();

    expect($response->json('clients.0.client_name'))->toBe('Atlas Imports');
    expect($response->json('clients.0.imports'))->toBe(3);
    expect($response->json('clients.0.exports'))->toBe(0);
    expect(collect($response->json('clients'))->pluck('client_name')->all())->toContain('Beacon Exports');
});

test('client report excludes transactions outside the requested month', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $importer = Client::factory()->importer()->create(['name' => 'March Imports']);
    $shipper = Client::factory()->exporter()->create(['name' => 'March Exports']);

    ImportTransaction::factory()->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-03-31 23:59:59',
        'updated_at' => '2026-04-02 09:00:00',
        'is_archive' => false,
    ]);

    ImportTransaction::factory()->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-04-01 00:00:00',
        'updated_at' => '2026-04-03 09:00:00',
        'is_archive' => false,
    ]);

    ExportTransaction::factory()->create([
        'shipper_id' => $shipper->id,
        'created_at' => '2026-03-01 00:00:00',
        'updated_at' => '2026-03-03 09:00:00',
        'is_archive' => false,
    ]);

    ExportTransaction::factory()->create([
        'shipper_id' => $shipper->id,
        'created_at' => '2026-02-28 23:59:59',
        'updated_at' => '2026-03-02 09:00:00',
        'is_archive' => false,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/reports/clients?year=2026&month=3')
        ->assertOk();

    $clients = collect($response->json('clients'))->keyBy('client_name');

    expect($clients->get('March Imports')['imports'])->toBe(1);
    expect($clients->get('March Exports')['exports'])->toBe(1);
});

test('turnaround report uses stable stage completion timestamps for completed and archived-from-live transactions', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $importer = Client::factory()->importer()->create();
    $shipper = Client::factory()->exporter()->create();

    $import = ImportTransaction::factory()->completed()->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-03-01 09:00:00',
        'updated_at' => '2026-03-20 09:00:00',
        'is_archive' => false,
    ]);
    $import->stages()->update([
        'billing_status' => 'completed',
        'billing_completed_at' => '2026-03-06 09:00:00',
    ]);

    $export = ExportTransaction::factory()->completed()->create([
        'shipper_id' => $shipper->id,
        'created_at' => '2026-03-10 09:00:00',
        'updated_at' => '2026-03-30 09:00:00',
        'is_archive' => false,
    ]);
    $export->stages()->update([
        'billing_status' => 'completed',
        'billing_completed_at' => '2026-03-13 09:00:00',
    ]);

    $archivedFromLiveImport = ImportTransaction::factory()->completed()->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-03-05 09:00:00',
        'updated_at' => '2026-03-18 09:00:00',
        'is_archive' => true,
        'archive_origin' => ArchiveOrigin::ArchivedFromLive,
    ]);
    $archivedFromLiveImport->stages()->update([
        'billing_status' => 'completed',
        'billing_completed_at' => '2026-03-09 09:00:00',
    ]);

    $directArchiveExport = ExportTransaction::factory()->completed()->create([
        'shipper_id' => $shipper->id,
        'created_at' => '2026-03-12 09:00:00',
        'updated_at' => '2026-03-25 09:00:00',
        'is_archive' => true,
        'archive_origin' => ArchiveOrigin::DirectArchiveUpload,
    ]);
    $directArchiveExport->stages()->update([
        'billing_status' => 'completed',
        'billing_completed_at' => '2026-03-15 09:00:00',
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/reports/turnaround?year=2026&month=3')
        ->assertOk();

    expect($response->json('imports.completed_count'))->toBe(2);
    expect($response->json('imports.avg_days'))->toBe(4.5);
    expect($response->json('imports.min_days'))->toBe(4);
    expect($response->json('imports.max_days'))->toBe(5);
    expect($response->json('exports.completed_count'))->toBe(1);
    expect($response->json('exports.avg_days'))->toBe(3);
});

test('archived-from-live transactions remain reportable after admin archive handoff', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $importer = Client::factory()->importer()->create(['name' => 'Archive Retained Importer']);
    $shipper = Client::factory()->exporter()->create(['name' => 'Archive Retained Exporter']);

    $import = ImportTransaction::factory()->completed()->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-04-02 09:00:00',
        'updated_at' => '2026-04-10 09:00:00',
        'is_archive' => true,
        'archive_origin' => ArchiveOrigin::ArchivedFromLive,
    ]);
    $import->stages()->update([
        'billing_status' => 'completed',
        'billing_completed_at' => '2026-04-06 09:00:00',
    ]);

    $export = ExportTransaction::factory()->completed()->create([
        'shipper_id' => $shipper->id,
        'created_at' => '2026-04-03 09:00:00',
        'updated_at' => '2026-04-11 09:00:00',
        'is_archive' => true,
        'archive_origin' => ArchiveOrigin::ArchivedFromLive,
    ]);
    $export->stages()->update([
        'billing_status' => 'completed',
        'billing_completed_at' => '2026-04-07 09:00:00',
    ]);

    $monthly = $this->actingAs($admin)
        ->getJson('/api/reports/monthly?year=2026')
        ->assertOk();

    $april = collect($monthly->json('months'))->firstWhere('month', 4);

    expect($april['imports'])->toBe(1);
    expect($april['exports'])->toBe(1);

    $clients = $this->actingAs($admin)
        ->getJson('/api/reports/clients?year=2026&month=4')
        ->assertOk();

    expect(collect($clients->json('clients'))->pluck('client_name')->all())
        ->toContain('Archive Retained Importer', 'Archive Retained Exporter');

    $turnaround = $this->actingAs($admin)
        ->getJson('/api/reports/turnaround?year=2026&month=4')
        ->assertOk();

    expect($turnaround->json('imports.completed_count'))->toBe(1);
    expect($turnaround->json('imports.avg_days'))->toBe(4);
    expect($turnaround->json('imports.min_days'))->toBe(4);
    expect($turnaround->json('exports.completed_count'))->toBe(1);
    expect($turnaround->json('exports.avg_days'))->toBe(4);
});

test('turnaround report excludes completed transactions outside the requested month', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $importer = Client::factory()->importer()->create();
    $shipper = Client::factory()->exporter()->create();

    $marchImport = ImportTransaction::factory()->completed()->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-03-31 23:59:59',
        'updated_at' => '2026-04-10 09:00:00',
        'is_archive' => false,
    ]);
    $marchImport->stages()->update([
        'billing_status' => 'completed',
        'billing_completed_at' => '2026-04-05 09:00:00',
    ]);

    $aprilImport = ImportTransaction::factory()->completed()->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-04-01 00:00:00',
        'updated_at' => '2026-04-07 09:00:00',
        'is_archive' => false,
    ]);
    $aprilImport->stages()->update([
        'billing_status' => 'completed',
        'billing_completed_at' => '2026-04-04 09:00:00',
    ]);

    $marchExport = ExportTransaction::factory()->completed()->create([
        'shipper_id' => $shipper->id,
        'created_at' => '2026-03-01 00:00:00',
        'updated_at' => '2026-03-09 09:00:00',
        'is_archive' => false,
    ]);
    $marchExport->stages()->update([
        'billing_status' => 'completed',
        'billing_completed_at' => '2026-03-04 09:00:00',
    ]);

    $februaryExport = ExportTransaction::factory()->completed()->create([
        'shipper_id' => $shipper->id,
        'created_at' => '2026-02-28 23:59:59',
        'updated_at' => '2026-03-08 09:00:00',
        'is_archive' => false,
    ]);
    $februaryExport->stages()->update([
        'billing_status' => 'completed',
        'billing_completed_at' => '2026-03-03 09:00:00',
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/reports/turnaround?year=2026&month=3')
        ->assertOk();

    expect($response->json('imports.completed_count'))->toBe(1);
    expect($response->json('imports.avg_days'))->toBe(5);
    expect($response->json('exports.completed_count'))->toBe(1);
    expect($response->json('exports.avg_days'))->toBe(3);
});
