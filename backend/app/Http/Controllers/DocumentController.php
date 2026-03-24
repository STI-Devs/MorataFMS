<?php

namespace App\Http\Controllers;

use App\Actions\Documents\StoreTransactionDocument;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Queries\Documents\DocumentTransactionIndexQuery;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    public function __construct(
        private StoreTransactionDocument $storeTransactionDocument,
        private DocumentTransactionIndexQuery $documentTransactionIndexQuery,
    ) {}

    /**
     * GET /api/documents
     * List all documents, optionally filtered by transaction.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Document::class);

        $query = Document::query()
            ->visibleTo($request->user())
            ->with('uploadedBy');

        // Filter by transaction type and ID
        if ($request->has('documentable_type') && $request->has('documentable_id')) {
            $query->where('documentable_type', $request->input('documentable_type'))
                ->where('documentable_id', $request->input('documentable_id'));
        }

        $documents = $query->orderBy('created_at', 'desc')->get();

        return DocumentResource::collection($documents);
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
        $document = $this->storeTransactionDocument->handle(
            $transaction,
            $request->file('file'),
            $validated['type'],
            $request->user()->id,
        );

        // Recalculate parent transaction's stage statuses based on uploaded docs
        $parent = $document->documentable;
        if ($parent && method_exists($parent, 'recalculateStatus')) {
            $parent->recalculateStatus();
        }

        return (new DocumentResource($document))
            ->response()
            ->setStatusCode(201);
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
     * Returns a viewer-ready representation of the stored file:
     * - S3 / cloud disk  → JSON { url } with a 60-second pre-signed URL.
     *   The frontend sends it to <iframe> / <img> / Google Docs Viewer.
     * - Local disk       → streams the file inline with the correct MIME type
     *   so the browser renders it natively.
     *
     * Uses the same disk as store() / download() / destroy() so the file is
     * guaranteed to exist.
     */
    public function preview(Document $document)
    {
        $this->authorize('view', $document);

        $disk = self::documentDisk();

        if (self::storageDisk() === 's3') {
            $url = $disk->temporaryUrl($document->path, now()->addMinutes(5));
        } else {
            $url = URL::temporarySignedRoute(
                'documents.stream',
                now()->addMinutes(5),
                ['document' => $document->id]
            );
        }

        return response()->json(['url' => $url]);
    }

    /**
     * GET /api/documents/{document}/stream
     *
     * Securely streams a file from the local disk when accessed via a signed route.
     * This mimics S3's pre-signed URL behavior natively.
     */
    public function stream(Document $document)
    {
        $disk = self::documentDisk();

        if (! $disk->exists($document->path)) {
            abort(404, 'File not found on storage.');
        }

        $mimeType = $disk->mimeType($document->path) ?: 'application/octet-stream';
        $stream = $disk->readStream($document->path);

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="'.addslashes($document->filename).'"',
            'Cache-Control' => 'no-store',
        ]);
    }

    // ─── Shared helpers ────────────────────────────────────────────────────────

    /**
     * Single source of truth for which storage disk all document operations use.
     * Override by setting APP_STORAGE_DISK in .env (default: 's3').
     */
    private static function storageDisk(): string
    {
        return config('filesystems.document_disk', 's3');
    }

    /**
     * @return FilesystemAdapter
     */
    private static function documentDisk()
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk(self::storageDisk());

        return $disk;
    }

    /**
     * GET /api/documents/{document}/download
     * Stream the file from S3 with proper headers.
     */
    public function download(Document $document): StreamedResponse
    {
        $this->authorize('view', $document);

        $disk = self::documentDisk();

        if (! $disk->exists($document->path)) {
            abort(404, 'File not found on storage.');
        }

        $stream = $disk->readStream($document->path);

        if (! $stream) {
            abort(500, 'Unable to read file stream.');
        }

        return response()->streamDownload(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, $document->filename);
    }

    /**
     * DELETE /api/documents/{document}
     * Delete the file from S3 and the database record.
     */
    public function destroy(Document $document)
    {
        $this->authorize('delete', $document);

        // Capture parent before deletion (relationship cleared after)
        $parent = $document->documentable;

        // delete() is a no-op if the file doesn't exist — no exists() check needed
        self::documentDisk()->delete($document->path);

        $document->delete();

        // Recalculate after deletion so status rolls back if needed
        if ($parent && method_exists($parent, 'recalculateStatus')) {
            $parent->recalculateStatus();
        }

        return response()->noContent();
    }

    private function resolveDocumentable(string $documentableType, int $documentableId): ImportTransaction|ExportTransaction
    {
        return match ($documentableType) {
            ImportTransaction::class => ImportTransaction::findOrFail($documentableId),
            ExportTransaction::class => ExportTransaction::findOrFail($documentableId),
        };
    }
}
