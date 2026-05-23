<?php

namespace App\Actions\Archives;

use App\Data\Archives\ArchiveExportData;
use App\Models\ExportTransaction;
use App\Models\User;
use App\Support\Transactions\TransactionSyncBroadcaster;

class UpdateArchiveExport
{
    public function __construct(private TransactionSyncBroadcaster $transactionSyncBroadcaster) {}

    public function handle(ExportTransaction $transaction, ArchiveExportData $data, User $actor): ExportTransaction
    {
        $transaction->update([
            'bl_no' => $data->blNo,
            'vessel' => $data->vessel,
            'shipper_id' => $data->shipperId,
            'destination_country_id' => $data->destinationCountryId,
            'export_date' => $data->fileDate,
        ]);

        $transaction->load(['shipper', 'stages', 'assignedUser', 'destinationCountry']);

        $this->transactionSyncBroadcaster->transactionChanged($transaction, $actor, 'archive_updated');

        return $transaction;
    }
}
