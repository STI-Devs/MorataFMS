<?php

namespace App\Http\Controllers\Notarial;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notarial\NotarialGeneratedDocumentIndexRequest;
use App\Http\Requests\Notarial\StoreEditableNotarialGeneratedDocumentRequest;
use App\Http\Resources\Notarial\NotarialGeneratedDocumentResource;
use App\Models\NotarialGeneratedDocument;
use App\Orchestrators\Notarial\NotarialGeneratedDocumentOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

class NotarialGeneratedDocumentController extends Controller
{
    public function __construct(
        private NotarialGeneratedDocumentOrchestrator $generatedDocuments,
    ) {}

    public function index(NotarialGeneratedDocumentIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialGeneratedDocument::class);

        return NotarialGeneratedDocumentResource::collection($this->generatedDocuments->index($request));
    }

    public function storeEditableCopy(StoreEditableNotarialGeneratedDocumentRequest $request): JsonResponse
    {
        $this->authorize('create', NotarialGeneratedDocument::class);

        return (new NotarialGeneratedDocumentResource(
            $this->generatedDocuments->storeEditableCopy($request->validated(), $request->user())
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function download(NotarialGeneratedDocument $document): StreamedResponse
    {
        $this->authorize('view', $document);

        return $this->generatedDocuments->download($document);
    }

    public function editorConfig(Request $request, NotarialGeneratedDocument $document): JsonResponse
    {
        $this->authorize('view', $document);

        return response()->json($this->generatedDocuments->editorConfig($document, $request->user()));
    }

    public function onlyOfficeFile(Request $request, NotarialGeneratedDocument $document): StreamedResponse
    {
        if (! $request->hasValidRelativeSignature()) {
            throw new HttpException(403, 'Invalid document editor link.');
        }

        return $this->generatedDocuments->download($document);
    }

    public function onlyOfficeCallback(Request $request, NotarialGeneratedDocument $document): JsonResponse
    {
        if (! $request->hasValidRelativeSignature()) {
            throw new HttpException(403, 'Invalid document editor callback.');
        }

        $status = (int) $request->integer('status');

        if (! $this->generatedDocuments->shouldHandleOnlyOfficeStatus($status)) {
            return response()->json(['error' => 0]);
        }

        $editedFileUrl = (string) $request->input('url', '');

        return response()->json([
            'error' => $this->generatedDocuments->storeOnlyOfficeCallbackFile($document, $editedFileUrl) ? 0 : 1,
        ]);
    }
}
