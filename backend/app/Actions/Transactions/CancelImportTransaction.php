<?php

namespace App\Actions\Transactions;

use App\Enums\ImportStatus;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Support\Transactions\ImportStatusWorkflow;
use App\Support\Transactions\TransactionSyncBroadcaster;

class CancelImportTransaction
{
    public function __construct(private TransactionSyncBroadcaster $transactionSyncBroadcaster) {}

    public function handle(ImportTransaction $transaction, string $reason, User $actor): ImportTransaction
    {
        if (! ImportStatusWorkflow::isCancellable($transaction->status)) {
            abort(422, 'Only active transactions can be cancelled.');
        }

        $transaction->status = ImportStatus::Cancelled;
        $transaction->notes = $reason;
        $transaction->save();

        $transaction->load(['importer', 'originCountry', 'locationOfGoods', 'stages', 'assignedUser']);
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $actor, 'cancelled');

        return $transaction;
    }
}
