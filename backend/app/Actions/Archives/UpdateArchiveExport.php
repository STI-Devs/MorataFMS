<?php

namespace App\Actions\Archives;

use App\Models\ExportTransaction;
use App\Models\User;
use App\Support\Transactions\TransactionSyncBroadcaster;

class UpdateArchiveExport
{
    public function __construct(private TransactionSyncBroadcaster $transactionSyncBroadcaster) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public function handle(ExportTransaction $transaction, array $validated, User $actor): ExportTransaction
    {
        $transaction->update([
            'bl_no' => $validated['bl_no'],
            'vessel' => $validated['vessel'] ?? null,
            'shipper_id' => $validated['shipper_id'],
            'destination_country_id' => $validated['destination_country_id'],
            'export_date' => $validated['file_date'],
        ]);

        $transaction->load(['shipper', 'stages', 'assignedUser', 'destinationCountry']);

        $this->transactionSyncBroadcaster->transactionChanged($transaction, $actor, 'archive_updated');

        return $transaction;
    }
}
