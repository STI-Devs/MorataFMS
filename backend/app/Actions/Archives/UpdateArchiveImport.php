<?php

namespace App\Actions\Archives;

use App\Models\ImportTransaction;
use App\Models\User;
use App\Support\Transactions\TransactionSyncBroadcaster;

class UpdateArchiveImport
{
    public function __construct(private TransactionSyncBroadcaster $transactionSyncBroadcaster) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public function handle(ImportTransaction $transaction, array $validated, User $actor): ImportTransaction
    {
        $transaction->update([
            'customs_ref_no' => $validated['customs_ref_no'] ?? null,
            'bl_no' => $validated['bl_no'],
            'vessel_name' => $validated['vessel_name'] ?? null,
            'selective_color' => $validated['selective_color'],
            'importer_id' => $validated['importer_id'],
            'origin_country_id' => $validated['origin_country_id'] ?? null,
            'location_of_goods_id' => $validated['location_of_goods_id'] ?? null,
            'arrival_date' => $validated['file_date'],
        ]);

        $transaction->load(['importer', 'originCountry', 'locationOfGoods', 'stages', 'assignedUser']);

        $this->transactionSyncBroadcaster->transactionChanged($transaction, $actor, 'archive_updated');

        return $transaction;
    }
}
