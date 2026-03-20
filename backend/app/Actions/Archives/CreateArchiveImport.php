<?php

namespace App\Actions\Archives;

use App\Actions\Documents\StoreTransactionDocument;
use App\Enums\ImportStatus;
use App\Models\ImportTransaction;
use App\Models\User;

class CreateArchiveImport
{
    public function __construct(private StoreTransactionDocument $storeTransactionDocument) {}

    public function handle(array $validated, User $user): ImportTransaction
    {
        $transaction = new ImportTransaction;
        $transaction->customs_ref_no = $validated['customs_ref_no']
            ?? 'ARCH-'.$validated['file_date'].'-'.strtoupper(substr(uniqid(), -6));
        $transaction->bl_no = $validated['bl_no'];
        $transaction->selective_color = $validated['selective_color'];
        $transaction->importer_id = $validated['importer_id'];
        $transaction->origin_country_id = $validated['origin_country_id'] ?? null;
        $transaction->arrival_date = $validated['file_date'];
        $transaction->notes = $validated['notes'] ?? null;
        $transaction->is_archive = true;
        $transaction->assigned_user_id = $user->id;
        $transaction->status = ImportStatus::Completed;
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
            $transaction->status = ImportStatus::Completed;
            $transaction->saveQuietly();
        }

        $transaction->load(['importer', 'originCountry', 'stages', 'assignedUser']);

        return $transaction;
    }
}
