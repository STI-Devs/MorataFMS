<?php

namespace App\Actions\Archives;

use App\Models\ImportTransaction;
use App\Models\User;
use App\Support\Operations\Deletion\Transactions\TransactionDeletionExecutor;
use App\Support\Operations\Deletion\Transactions\TransactionDeletionPlanner;
use App\Support\Transactions\TransactionSyncBroadcaster;

class RollbackArchiveImport
{
    public function __construct(
        private TransactionDeletionPlanner $transactionDeletionPlanner,
        private TransactionDeletionExecutor $transactionDeletionExecutor,
        private TransactionSyncBroadcaster $transactionSyncBroadcaster,
    ) {}

    public function handle(ImportTransaction $transaction, User $actor): void
    {
        $plan = $this->transactionDeletionPlanner->build(
            [$transaction->id],
            [],
            (string) config('database.default'),
        );

        $this->transactionSyncBroadcaster->transactionChanged($transaction, $actor, 'archive_rolled_back');
        $this->transactionDeletionExecutor->delete($plan, true);
    }
}
