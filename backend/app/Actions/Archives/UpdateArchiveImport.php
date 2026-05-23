<?php

namespace App\Actions\Archives;

use App\Data\Archives\ArchiveImportData;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Support\Transactions\TransactionSyncBroadcaster;

class UpdateArchiveImport
{
    public function __construct(private TransactionSyncBroadcaster $transactionSyncBroadcaster) {}

    public function handle(ImportTransaction $transaction, ArchiveImportData $data, User $actor): ImportTransaction
    {
        $transaction->update([
            'customs_ref_no' => $data->customsRefNo,
            'bl_no' => $data->blNo,
            'vessel_name' => $data->vesselName,
            'selective_color' => $data->selectiveColor->value,
            'importer_id' => $data->importerId,
            'origin_country_id' => $data->originCountryId,
            'location_of_goods_id' => $data->locationOfGoodsId,
            'arrival_date' => $data->fileDate,
        ]);

        $transaction->load(['importer', 'originCountry', 'locationOfGoods', 'stages', 'assignedUser']);

        $this->transactionSyncBroadcaster->transactionChanged($transaction, $actor, 'archive_updated');

        return $transaction;
    }
}
