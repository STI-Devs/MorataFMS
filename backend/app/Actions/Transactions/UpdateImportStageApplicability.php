<?php

namespace App\Actions\Transactions;

use App\Models\ImportTransaction;
use App\Models\User;
use App\Support\Transactions\TransactionSyncBroadcaster;
use Illuminate\Validation\ValidationException;

class UpdateImportStageApplicability
{
    public function __construct(private TransactionSyncBroadcaster $transactionSyncBroadcaster) {}

    public function handle(
        ImportTransaction $transaction,
        string $stage,
        bool $notApplicable,
        User $actor,
        string $eventType = 'stage_applicability_updated',
    ): ImportTransaction {
        if ($notApplicable && $transaction->documents()->where('type', $stage)->exists()) {
            throw ValidationException::withMessages([
                'stage' => ['You cannot mark this stage as not applicable after files have been uploaded to it.'],
            ]);
        }

        $transaction->loadMissing('stages');

        if ($notApplicable && ! $transaction->isDocumentTypeReadyForUpload($stage)) {
            throw ValidationException::withMessages([
                'stage' => ['Complete the earlier required stages before marking this stage as not applicable.'],
            ]);
        }

        $transaction->setStageApplicability($stage, $notApplicable, $actor->id);
        $transaction->recalculateStatus();
        $transaction->load(['importer', 'originCountry', 'locationOfGoods', 'stages', 'assignedUser']);

        $this->transactionSyncBroadcaster->transactionChanged(
            $transaction,
            $actor,
            $eventType,
        );

        return $transaction;
    }
}
