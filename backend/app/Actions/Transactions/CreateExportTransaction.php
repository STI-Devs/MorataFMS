<?php

namespace App\Actions\Transactions;

use App\Enums\ExportStatus;
use App\Models\ExportTransaction;
use App\Models\User;
use App\Support\Transactions\TransactionSyncBroadcaster;

class CreateExportTransaction
{
    public function __construct(private TransactionSyncBroadcaster $transactionSyncBroadcaster) {}

    public function handle(array $data, User $actor): ExportTransaction
    {
        $transaction = new ExportTransaction($data);
        $transaction->assigned_user_id = $actor->id;
        $transaction->status = ExportStatus::Pending;
        $transaction->save();

        $transaction->load(['shipper', 'stages', 'assignedUser', 'destinationCountry']);
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $actor, 'created');

        return $transaction;
    }
}
