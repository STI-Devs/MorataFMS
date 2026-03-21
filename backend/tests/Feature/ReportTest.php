<?php

use App\Models\Client;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;

test('admin can view monthly report counts for live transactions only', function () {
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
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/reports/monthly?year=2026')
        ->assertOk();

    $march = collect($response->json('months'))->firstWhere('month', 3);

    expect($march['imports'])->toBe(1);
    expect($march['exports'])->toBe(1);
    expect($response->json('total_imports'))->toBe(1);
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

    $response = $this->actingAs($admin)
        ->getJson('/api/reports/clients?year=2026&month=3')
        ->assertOk();

    expect($response->json('clients.0.client_name'))->toBe('Atlas Imports');
    expect($response->json('clients.0.imports'))->toBe(2);
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

test('turnaround report calculates completed durations on sqlite-compatible queries', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $importer = Client::factory()->importer()->create();
    $shipper = Client::factory()->exporter()->create();

    ImportTransaction::factory()->completed()->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-03-01 09:00:00',
        'updated_at' => '2026-03-06 09:00:00',
        'is_archive' => false,
    ]);

    ExportTransaction::factory()->completed()->create([
        'shipper_id' => $shipper->id,
        'created_at' => '2026-03-10 09:00:00',
        'updated_at' => '2026-03-13 09:00:00',
        'is_archive' => false,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/reports/turnaround?year=2026&month=3')
        ->assertOk();

    expect($response->json('imports.completed_count'))->toBe(1);
    expect($response->json('imports.avg_days'))->toBe(5);
    expect($response->json('imports.min_days'))->toBe(5);
    expect($response->json('imports.max_days'))->toBe(5);
    expect($response->json('exports.completed_count'))->toBe(1);
    expect($response->json('exports.avg_days'))->toBe(3);
});

test('turnaround report excludes completed transactions outside the requested month', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $importer = Client::factory()->importer()->create();
    $shipper = Client::factory()->exporter()->create();

    ImportTransaction::factory()->completed()->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-03-31 23:59:59',
        'updated_at' => '2026-04-05 09:00:00',
        'is_archive' => false,
    ]);

    ImportTransaction::factory()->completed()->create([
        'importer_id' => $importer->id,
        'created_at' => '2026-04-01 00:00:00',
        'updated_at' => '2026-04-04 09:00:00',
        'is_archive' => false,
    ]);

    ExportTransaction::factory()->completed()->create([
        'shipper_id' => $shipper->id,
        'created_at' => '2026-03-01 00:00:00',
        'updated_at' => '2026-03-04 09:00:00',
        'is_archive' => false,
    ]);

    ExportTransaction::factory()->completed()->create([
        'shipper_id' => $shipper->id,
        'created_at' => '2026-02-28 23:59:59',
        'updated_at' => '2026-03-03 09:00:00',
        'is_archive' => false,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/reports/turnaround?year=2026&month=3')
        ->assertOk();

    expect($response->json('imports.completed_count'))->toBe(1);
    expect($response->json('imports.avg_days'))->toBe(5);
    expect($response->json('exports.completed_count'))->toBe(1);
    expect($response->json('exports.avg_days'))->toBe(3);
});
