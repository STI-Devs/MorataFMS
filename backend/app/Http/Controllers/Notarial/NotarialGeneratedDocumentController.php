<?php

namespace App\Http\Controllers\Notarial;

use App\Actions\Notarial\CreateEditableNotarialGeneratedDocument;
use App\Http\Controllers\Controller;
use App\Http\Requests\Notarial\NotarialGeneratedDocumentIndexRequest;
use App\Http\Requests\Notarial\StoreEditableNotarialGeneratedDocumentRequest;
use App\Http\Resources\Notarial\NotarialGeneratedDocumentResource;
use App\Models\NotarialGeneratedDocument;
use App\Queries\Notarial\NotarialGeneratedDocumentIndexQuery;
use App\Support\Legal\OnlyOfficeDocumentEditor;
use App\Support\Legal\StoredFileDownloader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

class NotarialGeneratedDocumentController extends Controller
{
    public function __construct(
        private NotarialGeneratedDocumentIndexQuery $notarialGeneratedDocumentIndexQuery,
        private CreateEditableNotarialGeneratedDocument $createEditableNotarialGeneratedDocument,
        private StoredFileDownloader $storedFileDownloader,
        private OnlyOfficeDocumentEditor $onlyOfficeDocumentEditor,
    ) {}

    public function index(NotarialGeneratedDocumentIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialGeneratedDocument::class);

        return NotarialGeneratedDocumentResource::collection($this->notarialGeneratedDocumentIndexQuery->handle($request));
    }

    public function storeEditableCopy(StoreEditableNotarialGeneratedDocumentRequest $request): JsonResponse
    {
        $this->authorize('create', NotarialGeneratedDocument::class);

        $document = $this->createEditableNotarialGeneratedDocument->handle($request->validated(), $request->user());

        return (new NotarialGeneratedDocumentResource($document))
            ->response()
            ->setStatusCode(201);
    }

    public function download(NotarialGeneratedDocument $document): StreamedResponse
    {
        $this->authorize('view', $document);

        return $this->storedFileDownloader->download(
            (string) $document->disk,
            $document->path,
            'Generated Word file not found on storage.',
            'Generated Word file not found on storage.',
            $document->filename,
            'Unable to read the generated Word file.',
        );
    }

    public function editorConfig(Request $request, NotarialGeneratedDocument $document): JsonResponse
    {
        $this->authorize('view', $document);

        return response()->json($this->onlyOfficeDocumentEditor->configForDocument($document, $request->user()));
    }

    public function onlyOfficeFile(Request $request, NotarialGeneratedDocument $document): StreamedResponse
    {
        if (! $request->hasValidRelativeSignature()) {
            throw new HttpException(403, 'Invalid document editor link.');
        }

        return $this->storedFileDownloader->download(
            (string) $document->disk,
            $document->path,
            'Generated Word file not found on storage.',
            'Generated Word file not found on storage.',
            $document->filename,
            'Unable to read the generated Word file.',
        );
    }

    public function onlyOfficeCallback(Request $request, NotarialGeneratedDocument $document): JsonResponse
    {
        if (! $request->hasValidRelativeSignature()) {
            throw new HttpException(403, 'Invalid document editor callback.');
        }

        $status = (int) $request->integer('status');

        if (! in_array($status, [2, 6], true)) {
            return response()->json(['error' => 0]);
        }

        $editedFileUrl = (string) $request->input('url', '');

        if ($editedFileUrl === '') {
            return response()->json(['error' => 1]);
        }

        if ($document->path === null || $document->path === '') {
            return response()->json(['error' => 1]);
        }

        $response = Http::connectTimeout(5)->timeout(30)->get($editedFileUrl);

        if (! $response->successful()) {
            return response()->json(['error' => 1]);
        }

        $disk = $this->storedFileDownloader->disk((string) $document->disk);

        if (! $disk->put($document->path, $response->body())) {
            return response()->json(['error' => 1]);
        }

        $document->forceFill([
            'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'size_bytes' => strlen($response->body()),
            'generated_at' => now(),
        ])->save();

        return response()->json(['error' => 0]);
    }
}
