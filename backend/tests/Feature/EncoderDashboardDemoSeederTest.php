<?php

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Carbon\CarbonImmutable;
use Database\Seeders\EncoderDashboardDemoSeeder;

beforeEach(function () {
    CarbonImmutable::setTestNow('2026-05-12 08:00:00');
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

test('encoder dashboard demo seeder creates a reusable non-empty encoder workload', function () {
    $this->seed(EncoderDashboardDemoSeeder::class);
    $this->seed(EncoderDashboardDemoSeeder::class);

    $encoder = User::query()->where('email', 'encoder@morata.com')->firstOrFail();

    expect($encoder->role->value)->toBe('encoder');
    expect(ImportTransaction::query()->where('customs_ref_no', 'like', 'DEMO-ENC-IMP-%')->count())->toBe(4);
    expect(ExportTransaction::query()->where('bl_no', 'like', 'DEMO-ENC-EXP-%')->count())->toBe(4);

    $response = $this->actingAs($encoder)
        ->getJson('/api/encoder/dashboard')
        ->assertOk();

    $attentionItems = collect($response->json('attention_items'));
    $clientVolume = collect($response->json('reports.client_volume.clients'));

    $response
        ->assertJsonPath('kpis.active_imports', 2)
        ->assertJsonPath('kpis.active_exports', 2)
        ->assertJsonPath('kpis.needs_update', 2)
        ->assertJsonPath('kpis.upcoming_eta_etd', 3)
        ->assertJsonPath('kpis.open_remarks', 1)
        ->assertJsonPath('kpis.document_gaps', 2)
        ->assertJsonPath('reports.monthly_volume.total_imports', 4)
        ->assertJsonPath('reports.monthly_volume.total_exports', 4)
        ->assertJsonPath('reports.monthly_volume.total', 8)
        ->assertJsonPath('analytics.activity.transactions_completed.this_month.imports', 2)
        ->assertJsonPath('analytics.activity.transactions_completed.this_month.exports', 2)
        ->assertJsonPath('analytics.activity.transactions_completed.this_month.total', 4)
        ->assertJsonPath('analytics.activity.documents_uploaded.this_month.total', 14)
        ->assertJsonPath('analytics.activity.records_finalized.this_month.imports', 1)
        ->assertJsonPath('analytics.activity.records_finalized.this_month.exports', 1)
        ->assertJsonPath('analytics.activity.records_finalized.this_month.total', 2)
        ->assertJsonPath('analytics.overdue_transactions.total', 2);

    expect($attentionItems->pluck('status')->all())
        ->toContain('needs_update', 'remark', 'missing');

    expect($clientVolume->firstWhere('client_name', 'Demo Encoder Dashboard Client'))->not->toBeNull();
});
