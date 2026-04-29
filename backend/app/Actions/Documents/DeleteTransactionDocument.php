<?php

namespace App\Actions\Documents;

use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Support\Documents\DocumentFileStreamer;
use App\Support\Transactions\TransactionSyncBroadcaster;

class DeleteTransactionDocument
{
    public function __construct(
        private DocumentFileStreamer $documentFileStreamer,
        private TransactionSyncBroadcaster $transactionSyncBroadcaster,
    ) {}

    public function handle(Document $document, User $actor): void
    {
        $parent = $document->documentable;

        $this->documentFileStreamer->delete($document);
        $document->delete();

        if ($parent && method_exists($parent, 'recalculateStatus')) {
            $parent->recalculateStatus();
        }

        if ($parent instanceof ImportTransaction || $parent instanceof ExportTransaction) {
            $this->transactionSyncBroadcaster->transactionChanged($parent, $actor, 'document_deleted');
        }
    }
}
