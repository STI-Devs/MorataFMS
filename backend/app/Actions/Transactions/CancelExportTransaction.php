<?php

namespace App\Actions\Transactions;

use App\Enums\ExportStatus;
use App\Models\ExportTransaction;
use App\Models\User;
use App\Support\Transactions\ExportStatusWorkflow;
use App\Support\Transactions\TransactionSyncBroadcaster;
use Illuminate\Validation\ValidationException;

class CancelExportTransaction
{
    public function __construct(private TransactionSyncBroadcaster $transactionSyncBroadcaster) {}

    public function handle(ExportTransaction $transaction, string $reason, User $actor): ExportTransaction
    {
        if (! ExportStatusWorkflow::isCancellable($transaction->status)) {
            throw ValidationException::withMessages([
                'status' => ['Only active transactions can be cancelled.'],
            ]);
        }

        $transaction->status = ExportStatus::Cancelled;
        $transaction->notes = $reason;
        $transaction->save();

        $transaction->load(['shipper', 'stages', 'assignedUser', 'destinationCountry']);
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $actor, 'cancelled');

        return $transaction;
    }
}
