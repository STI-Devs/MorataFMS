<?php

namespace App\Actions\Documents;

use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Support\Documents\DocumentFileStreamer;
use App\Support\Transactions\TransactionSyncBroadcaster;
use Illuminate\Http\UploadedFile;

class ReplaceTransactionDocument
{
    public function __construct(
        private StoreTransactionDocument $storeTransactionDocument,
        private DocumentFileStreamer $documentFileStreamer,
        private TransactionSyncBroadcaster $transactionSyncBroadcaster,
    ) {}

    public function handle(Document $document, UploadedFile $file, User $actor): Document
    {
        $parent = $document->documentable;

        $newDocument = $this->storeTransactionDocument->handle(
            $parent,
            $file,
            $document->type,
            $actor->id,
        );

        $this->documentFileStreamer->delete($document);
        $document->delete();

        if ($parent && method_exists($parent, 'recalculateStatus')) {
            $parent->recalculateStatus();
        }

        if ($parent instanceof ImportTransaction || $parent instanceof ExportTransaction) {
            $this->transactionSyncBroadcaster->transactionChanged($parent, $actor, 'document_uploaded');
        }

        return $newDocument;
    }
}
