<?php

namespace App\Actions\Transactions;

use App\Models\ImportTransaction;
use App\Models\User;
use App\Support\Transactions\TransactionSyncBroadcaster;

class UpdateImportTransaction
{
    public function __construct(private TransactionSyncBroadcaster $transactionSyncBroadcaster) {}

    public function handle(ImportTransaction $transaction, array $data, User $actor): ImportTransaction
    {
        $transaction->update($data);

        $transaction->load(['importer', 'originCountry', 'locationOfGoods', 'stages', 'assignedUser']);
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $actor, 'updated');

        return $transaction;
    }
}
