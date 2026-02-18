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

        // Generate S3 path
        $path = Document::generateS3Path(
            $validated['documentable_type'],
            $validated['documentable_id'],
            $validated['type'],
            $file->getClientOriginalName()
        );

        // Store file in S3
        $storedPath = Storage::disk('s3')->putFileAs(
            dirname($path),
            $file,
            basename($path)
        );

        // Create document record
        $document = new Document($validated);
        $document->documentable_type = $validated['documentable_type'];
        $document->documentable_id = $validated['documentable_id'];
        $document->filename = $file->getClientOriginalName();
        $document->path = $storedPath;
        $document->size_bytes = $file->getSize();
        $document->uploaded_by = $request->user()->id;
        $document->save();

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

        // Check if file exists in S3
        if (!Storage::disk('s3')->exists($document->path)) {
            abort(404, 'File not found in storage.');
        }

        // Get the file stream from S3
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

        // Delete from S3
        if (Storage::disk('s3')->exists($document->path)) {
            Storage::disk('s3')->delete($document->path);
        }

        // Delete database record
        $document->delete();

        return response()->noContent();
    }
}
