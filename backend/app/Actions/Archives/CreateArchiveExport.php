<?php

namespace App\Actions\Archives;

use App\Actions\Documents\StoreTransactionDocument;
use App\Enums\ExportStatus;
use App\Models\ExportTransaction;
use App\Models\User;

class CreateArchiveExport
{
    public function __construct(private StoreTransactionDocument $storeTransactionDocument) {}

    public function handle(array $validated, User $user): ExportTransaction
    {
        $transaction = new ExportTransaction;
        $transaction->bl_no = $validated['bl_no'];
        $transaction->vessel = $validated['vessel'] ?? 'N/A';
        $transaction->shipper_id = $validated['shipper_id'];
        $transaction->destination_country_id = $validated['destination_country_id'];
        $transaction->notes = $validated['notes'] ?? null;
        $transaction->export_date = $validated['file_date'];
        $transaction->is_archive = true;
        $transaction->assigned_user_id = $user->id;
        $transaction->status = ExportStatus::Completed;
        $transaction->save();

        foreach ($validated['documents'] ?? [] as $document) {
            $this->storeTransactionDocument->handle(
                $transaction,
                $document['file'],
                $document['stage'],
                $user->id,
            );
        }

        if (! empty($validated['documents']) && method_exists($transaction, 'recalculateStatus')) {
            $transaction->recalculateStatus();
            $transaction->status = ExportStatus::Completed;
            $transaction->saveQuietly();
        }

        $transaction->load(['shipper', 'destinationCountry', 'stages', 'assignedUser']);

        return $transaction;
    }
}
