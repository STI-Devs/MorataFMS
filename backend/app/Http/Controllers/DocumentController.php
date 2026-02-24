<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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

        // Look up BL number from the transaction for a human-readable S3 path
        $transaction = $validated['documentable_type']::find($validated['documentable_id']);
        $blNo = $transaction?->bl_no ?? '';

        // Generate S3 path: documents/{imports|exports}/{year}/{BL}/{type}/{timestamp}_{name}
        $path = Document::generateS3Path(
            $validated['documentable_type'],
            $validated['documentable_id'],
            $validated['type'],
            $file->getClientOriginalName(),
            $blNo,
            now()->year,
        );

        // Upload file to S3 — wrap in transaction so DB record only saves if S3 succeeds
        $document = \DB::transaction(function () use ($file, $path, $validated, $request) {
            // writeStream is the only confirmed-working method for this S3 config
            $stream = fopen($file->getRealPath(), 'r');
            try {
                Storage::disk('s3')->writeStream($path, $stream);
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
     * GET /api/documents/{document}/download
     * Stream the file from S3 with proper headers.
     */
    public function download(Document $document): StreamedResponse
    {
        $this->authorize('view', $document);

        // readStream throws UnableToReadFile if the path doesn't exist in S3
        $stream = Storage::disk('s3')->readStream($document->path);

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

        // delete() is a no-op if the file doesn't exist — no exists() check needed
        Storage::disk('s3')->delete($document->path);

        $document->delete();

        return response()->noContent();
    }
}
