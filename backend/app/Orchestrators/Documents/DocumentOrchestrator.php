<?php

namespace App\Orchestrators\Documents;

use App\Actions\Documents\DeleteTransactionDocument;
use App\Actions\Documents\ReplaceTransactionDocument;
use App\Actions\Documents\UploadTransactionDocument;
use App\Actions\Documents\UploadVesselBillingDocuments;
use App\Http\Requests\Documents\ReplaceDocumentRequest;
use App\Http\Requests\Documents\StoreDocumentRequest;
use App\Http\Requests\Documents\StoreVesselBillingDocumentsRequest;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Queries\Documents\DocumentIndexQuery;
use App\Queries\Documents\DocumentTransactionIndexQuery;
use App\Support\Documents\DocumentableTransactionResolver;
use App\Support\Documents\DocumentFileStreamer;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentOrchestrator
{
    public function __construct(
        private UploadTransactionDocument $uploadTransactionDocument,
        private UploadVesselBillingDocuments $uploadVesselBillingDocuments,
        private DeleteTransactionDocument $deleteTransactionDocument,
        private ReplaceTransactionDocument $replaceTransactionDocument,
        private DocumentIndexQuery $documentIndexQuery,
        private DocumentTransactionIndexQuery $documentTransactionIndexQuery,
        private DocumentableTransactionResolver $documentableTransactionResolver,
        private DocumentFileStreamer $documentFileStreamer,
    ) {}

    /**
     * @return Collection<int, Document>
     */
    public function index(Request $request): Collection
    {
        return $this->documentIndexQuery->handle($request);
    }

    /**
     * @return array{
     *     data: list<array<string, mixed>>,
     *     counts: array{completed: int, imports: int, exports: int, cancelled: int},
     *     meta: array{current_page: int, last_page: int, per_page: int, total: int}
     * }
     */
    public function transactions(Request $request): array
    {
        return $this->documentTransactionIndexQuery->handle($request);
    }

    public function documentableFor(
        StoreDocumentRequest|StoreVesselBillingDocumentsRequest $request,
    ): ImportTransaction|ExportTransaction {
        return $this->documentableTransactionResolver->resolveFromValidated($request->validated());
    }

    public function store(StoreDocumentRequest $request, ImportTransaction|ExportTransaction $transaction): Document
    {
        $validated = $request->validated();

        return $this->uploadTransactionDocument->handle(
            $transaction,
            $request->file('file'),
            $validated['type'],
            $request->user(),
        );
    }

    /**
     * @return array{
     *     vessel_name: string,
     *     affected_transaction_ids: list<int>,
     *     affected_transactions_count: int,
     *     uploaded_documents_count: int
     * }
     */
    public function storeVesselBilling(
        StoreVesselBillingDocumentsRequest $request,
        ImportTransaction|ExportTransaction $transaction,
    ): array {
        return $this->uploadVesselBillingDocuments->handle(
            $transaction,
            $request->file('files', []),
            $request->user(),
        );
    }

    public function show(Document $document): Document
    {
        return $document->load('uploadedBy');
    }

    public function preview(Document $document): StreamedResponse
    {
        return $this->documentFileStreamer->inline($document);
    }

    public function stream(Document $document): StreamedResponse
    {
        return $this->documentFileStreamer->inline($document);
    }

    public function download(Document $document): StreamedResponse
    {
        return $this->documentFileStreamer->download($document);
    }

    public function delete(Document $document, User $actor): void
    {
        $this->deleteTransactionDocument->handle($document, $actor);
    }

    public function replace(ReplaceDocumentRequest $request, Document $document): Document
    {
        return $this->replaceTransactionDocument->handle(
            $document,
            $request->file('file'),
            $request->user(),
        );
    }
}
