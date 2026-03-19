<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    /**
     * GET /api/documents
     * List all documents, optionally filtered by transaction.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Document::class);

        $query = Document::with('uploadedBy');

        // Filter by transaction type and ID
        if ($request->has('documentable_type') && $request->has('documentable_id')) {
            $query->where('documentable_type', $request->input('documentable_type'))
                ->where('documentable_id', $request->input('documentable_id'));
        }

        $documents = $query->orderBy('created_at', 'desc')->get();

        return DocumentResource::collection($documents);
    }

    /**
     * POST /api/documents
     * Upload a file to S3 and create a document record.
     */
    public function store(StoreDocumentRequest $request)
    {
        $this->authorize('create', Document::class);

        $file = $request->file('file');
        $validated = $request->validated();

        // Look up BL number and date from the transaction for a human-readable S3 path
        $transaction = $validated['documentable_type']::find($validated['documentable_id']);
        $blNo = $transaction?->bl_no ?? '';

        // Derive year and month from transaction date:
        // arrival_date (imports) → export_date (exports) → created_at → now()
        $transactionDate = $transaction?->arrival_date
            ?? $transaction?->export_date
            ?? $transaction?->created_at
            ?? now();
        $transactionYear = $transactionDate->year;
        $transactionMonth = $transactionDate->month;

        // Generate S3 path: {documents|archives}/{imports|exports}/{year}/{MM-Month}/{BL}/{type}_{name}
        $isArchive = (bool) ($transaction?->is_archive ?? false);
        $path = Document::generateS3Path(
            $validated['documentable_type'],
            $validated['documentable_id'],
            $validated['type'],
            $file->getClientOriginalName(),
            $blNo,
            $transactionYear,
            $isArchive,
            $transactionMonth,
        );

        // Upload file — wrap in transaction so DB record only saves if storage write succeeds
        $document = \DB::transaction(function () use ($file, $path, $validated, $request) {
            // writeStream is the only confirmed-working method for this storage config
            $stream = fopen($file->getRealPath(), 'r');
            try {
                Storage::disk(self::storageDisk())->writeStream($path, $stream);
            } finally {
                if (is_resource($stream))
                    fclose($stream);
            }


            $document = new Document($validated);
            $document->documentable_type = $validated['documentable_type'];
            $document->documentable_id = $validated['documentable_id'];
            $document->filename = $file->getClientOriginalName();
            $document->path = $path;
            $document->size_bytes = $file->getSize();
            $document->uploaded_by = $request->user()->id;
            $document->save();

            return $document;
        });

        $document->load('uploadedBy');

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

        $diskName = self::storageDisk();

        if ($diskName === 's3') {
            /** @var \Illuminate\Filesystem\AwsS3V3Adapter $disk */
            $disk = Storage::disk($diskName);
            $url  = $disk->temporaryUrl($document->path, now()->addMinutes(5));
        } else {
            // Local disk — generate a secure signed route that acts like a pre-signed URL
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
        // Authorization is handled implicitly by the 'signed' middleware route protection.
        
        $disk = Storage::disk(self::storageDisk());

        if (! $disk->exists($document->path)) {
            abort(404, 'File not found on storage.');
        }

        $mimeType = $disk->mimeType($document->path) ?: 'application/octet-stream';
        $stream   = $disk->readStream($document->path);

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, [
            'Content-Type'        => $mimeType,
            'Content-Disposition' => 'inline; filename="' . addslashes($document->filename) . '"',
            'Cache-Control'       => 'no-store',
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
     * GET /api/documents/{document}/download
     * Stream the file from S3 with proper headers.
     */
    public function download(Document $document): StreamedResponse
    {
        $this->authorize('view', $document);

        $disk = Storage::disk(self::storageDisk());

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
        Storage::disk(self::storageDisk())->delete($document->path);

        $document->delete();

        // Recalculate after deletion so status rolls back if needed
        if ($parent && method_exists($parent, 'recalculateStatus')) {
            $parent->recalculateStatus();
        }

        return response()->noContent();
    }
}
