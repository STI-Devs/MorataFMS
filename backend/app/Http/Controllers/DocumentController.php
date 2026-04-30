<?php

namespace App\Http\Controllers;

use App\Actions\Documents\DeleteTransactionDocument;
use App\Actions\Documents\ReplaceTransactionDocument;
use App\Actions\Documents\UploadTransactionDocument;
use App\Actions\Documents\UploadVesselBillingDocuments;
use App\Http\Requests\ReplaceDocumentRequest;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\StoreVesselBillingDocumentsRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Queries\Documents\DocumentIndexQuery;
use App\Queries\Documents\DocumentTransactionIndexQuery;
use App\Support\Documents\DocumentFileStreamer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    public function __construct(
        private UploadTransactionDocument $uploadTransactionDocument,
        private UploadVesselBillingDocuments $uploadVesselBillingDocuments,
        private DeleteTransactionDocument $deleteTransactionDocument,
        private ReplaceTransactionDocument $replaceTransactionDocument,
        private DocumentIndexQuery $documentIndexQuery,
        private DocumentTransactionIndexQuery $documentTransactionIndexQuery,
        private DocumentFileStreamer $documentFileStreamer,
    ) {}

    /**
     * GET /api/documents
     * List all documents, optionally filtered by transaction.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Document::class);

        return DocumentResource::collection($this->documentIndexQuery->handle($request));
    }

    /**
     * GET /api/documents/transactions
     * Combined paginated list of finalized import/export transactions for the documents page.
     */
    public function transactions(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Document::class);

        return response()->json($this->documentTransactionIndexQuery->handle($request));
    }

    /**
     * POST /api/documents
     * Upload a file to S3 and create a document record.
     */
    public function store(StoreDocumentRequest $request)
    {
        $validated = $request->validated();
        $transaction = $this->resolveDocumentable($validated['documentable_type'], $validated['documentable_id']);
        $this->authorize('create', [Document::class, $transaction]);
        $document = $this->uploadTransactionDocument->handle(
            $transaction,
            $request->file('file'),
            $validated['type'],
            $request->user(),
        );

        return (new DocumentResource($document))
            ->response()
            ->setStatusCode(201);
    }

    public function storeVesselBilling(StoreVesselBillingDocumentsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $transaction = $this->resolveDocumentable($validated['documentable_type'], $validated['documentable_id']);

        $this->authorize('create', [Document::class, $transaction]);

        return response()->json([
            'data' => $this->uploadVesselBillingDocuments->handle(
                $transaction,
                $request->file('files', []),
                $request->user(),
            ),
        ], 201);
    }

    /**
     * GET /api/documents/{document}
     * Get document metadata.
     */
    public function show(Document $document)
    {
        $this->authorize('view', $document);

        $document->load('uploadedBy');

        return new DocumentResource($document);
    }

    /**
     * GET /api/documents/{document}/preview
     *
     * Streams the file inline for an authenticated, authorized browser session.
     */
    public function preview(Document $document): StreamedResponse
    {
        $this->authorize('view', $document);

        return $this->documentFileStreamer->inline($document);
    }

    /**
     * GET /api/documents/{document}/stream
     *
     * Securely streams a file inline for authenticated users.
     */
    public function stream(Document $document): StreamedResponse
    {
        $this->authorize('view', $document);

        return $this->documentFileStreamer->inline($document);
    }

    /**
     * GET /api/documents/{document}/download
     * Stream the file from S3 with proper headers.
     */
    public function download(Document $document): StreamedResponse
    {
        $this->authorize('view', $document);

        return $this->documentFileStreamer->download($document);
    }

    /**
     * DELETE /api/documents/{document}
     * Delete the file from S3 and the database record.
     */
    public function destroy(Request $request, Document $document)
    {
        $this->authorize('delete', $document);

        $this->deleteTransactionDocument->handle($document, $request->user());

        return response()->noContent();
    }

    /**
     * POST /api/documents/{document}/replace
     * Replace an existing document with a new file.
     */
    public function replace(ReplaceDocumentRequest $request, Document $document): JsonResponse
    {
        $this->authorize('replace', $document);

        $newDocument = $this->replaceTransactionDocument->handle(
            $document,
            $request->file('file'),
            $request->user(),
        );

        return (new DocumentResource($newDocument))
            ->response()
            ->setStatusCode(201);
    }

    private function resolveDocumentable(string $documentableType, int $documentableId): ImportTransaction|ExportTransaction
    {
        return match ($documentableType) {
            ImportTransaction::class => ImportTransaction::findOrFail($documentableId),
            ExportTransaction::class => ExportTransaction::findOrFail($documentableId),
        };
    }
}
