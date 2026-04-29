<?php

namespace App\Actions\Documents;

use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Support\Transactions\TransactionSyncBroadcaster;
use Illuminate\Http\UploadedFile;

class UploadTransactionDocument
{
    public function __construct(
        private StoreTransactionDocument $storeTransactionDocument,
        private TransactionSyncBroadcaster $transactionSyncBroadcaster,
    ) {}

    public function handle(
        ImportTransaction|ExportTransaction $transaction,
        UploadedFile $file,
        string $type,
        User $actor,
    ): Document {
        $document = $this->storeTransactionDocument->handle(
            $transaction,
            $file,
            $type,
            $actor->id,
        );

        $parent = $document->documentable;

        if ($parent && method_exists($parent, 'recalculateStatus')) {
            if (method_exists($parent, 'syncStageCompletionForDocument')) {
                $parent->syncStageCompletionForDocument($type, $actor->id);
            }

            $parent->recalculateStatus();
        }

        if ($parent instanceof ImportTransaction || $parent instanceof ExportTransaction) {
            $this->transactionSyncBroadcaster->transactionChanged($parent, $actor, 'document_uploaded');
        }

        return $document;
    }
}
