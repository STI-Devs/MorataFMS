<?php

namespace App\Actions\Transactions;

use App\Models\ExportTransaction;
use App\Models\User;
use App\Support\Transactions\TransactionSyncBroadcaster;

class UpdateExportTransaction
{
    public function __construct(private TransactionSyncBroadcaster $transactionSyncBroadcaster) {}

    public function handle(ExportTransaction $transaction, array $data, User $actor): ExportTransaction
    {
        $transaction->update($data);

        $transaction->load(['shipper', 'stages', 'assignedUser', 'destinationCountry']);
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $actor, 'updated');

        return $transaction;
    }
}
