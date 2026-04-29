<?php

namespace App\Actions\Transactions;

use App\Enums\ImportStatus;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Support\Transactions\TransactionSyncBroadcaster;

class CreateImportTransaction
{
    public function __construct(private TransactionSyncBroadcaster $transactionSyncBroadcaster) {}

    public function handle(array $data, User $actor): ImportTransaction
    {
        $transaction = new ImportTransaction($data);
        $transaction->assigned_user_id = $actor->id;
        $transaction->status = ImportStatus::Pending;
        $transaction->save();

        $transaction->load(['importer', 'originCountry', 'locationOfGoods', 'stages', 'assignedUser']);
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $actor, 'created');

        return $transaction;
    }
}
