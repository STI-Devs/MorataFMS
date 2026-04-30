<?php

use App\Enums\StageStatus;
use App\Models\Document;
use App\Models\ImportTransaction;
use App\Models\User;
use Database\Seeders\AccountantBillingDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('accountant billing demo seeder creates five billing-ready imports on the same vessel', function () {
    $this->seed(AccountantBillingDemoSeeder::class);

    $accountant = User::query()->where('email', 'accountant@morata.com')->first();
    $transactions = ImportTransaction::query()
        ->where('customs_ref_no', 'like', 'DEMO-ACC-BILL-%')
        ->orderBy('customs_ref_no')
        ->get();

    expect($accountant)->not->toBeNull();
    expect($transactions)->toHaveCount(5);
    expect($transactions->pluck('vessel_name')->unique()->values()->all())->toBe(['MV Shared Ledger']);
    expect($transactions->pluck('status')->map(fn ($status) => $status->value)->unique()->values()->all())->toBe(['Pending']);

    foreach ($transactions as $transaction) {
        $transaction->loadMissing('stages', 'documents');

        expect($transaction->documents)->toHaveCount(0);
        expect($transaction->stages)->not->toBeNull();
        expect($transaction->stages->boc_status)->toBe(StageStatus::Completed);
        expect($transaction->stages->bonds_status)->toBe(StageStatus::Completed);
        expect($transaction->stages->ppa_status)->toBe(StageStatus::Completed);
        expect($transaction->stages->do_status)->toBe(StageStatus::Completed);
        expect($transaction->stages->port_charges_status)->toBe(StageStatus::Completed);
        expect($transaction->stages->releasing_status)->toBe(StageStatus::Completed);
        expect($transaction->stages->billing_status)->toBe(StageStatus::Pending);
        expect($transaction->stages->billing_completed_by)->toBeNull();
        expect($transaction->stages->billing_completed_at)->toBeNull();
    }

    $queueTransactions = ImportTransaction::query()
        ->relevantToOperationalQueue($accountant)
        ->where('vessel_name', 'MV Shared Ledger')
        ->get();

    expect($queueTransactions)->toHaveCount(5);
});

test('accountant billing demo seeder resets previous demo billing uploads back to ready state', function () {
    $this->seed(AccountantBillingDemoSeeder::class);

    $accountant = User::query()->where('email', 'accountant@morata.com')->firstOrFail();
    $transaction = ImportTransaction::query()
        ->where('customs_ref_no', 'DEMO-ACC-BILL-001')
        ->firstOrFail();

    Document::factory()->create([
        'type' => 'billing',
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $transaction->id,
        'uploaded_by' => $accountant->id,
    ]);

    $transaction->stages()->update([
        'billing_status' => StageStatus::Completed->value,
        'billing_completed_at' => now(),
        'billing_completed_by' => $accountant->id,
    ]);
    $transaction->update([
        'status' => 'Completed',
    ]);

    $this->seed(AccountantBillingDemoSeeder::class);

    $transaction->refresh()->load('documents', 'stages');

    expect($transaction->status->value)->toBe('Pending');
    expect($transaction->documents)->toHaveCount(0);
    expect($transaction->stages->billing_status)->toBe(StageStatus::Pending);
    expect($transaction->stages->billing_completed_by)->toBeNull();
    expect($transaction->stages->billing_completed_at)->toBeNull();
});
