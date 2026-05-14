<?php

namespace App\Http\Controllers\LawFirmDocuments;

use App\Enums\LawFirmDocumentModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\LawFirmDocuments\LawFirmGeneratedDocumentIndexRequest;
use App\Http\Requests\LawFirmDocuments\StoreEditableLawFirmGeneratedDocumentRequest;
use App\Http\Resources\LawFirmDocuments\LawFirmGeneratedDocumentResource;
use App\Models\NotarialGeneratedDocument;
use App\Orchestrators\LawFirmDocuments\LawFirmGeneratedDocumentOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

class LawFirmGeneratedDocumentController extends Controller
{
    public function __construct(
        private LawFirmGeneratedDocumentOrchestrator $generatedDocuments,
    ) {}

    public function index(LawFirmGeneratedDocumentIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialGeneratedDocument::class);

        return LawFirmGeneratedDocumentResource::collection($this->generatedDocuments->index($request));
    }

    public function storeEditableCopy(StoreEditableLawFirmGeneratedDocumentRequest $request): JsonResponse
    {
        $this->authorize('create', NotarialGeneratedDocument::class);

        return (new LawFirmGeneratedDocumentResource(
            $this->generatedDocuments->storeEditableCopy($request->validated(), $request->user())
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, NotarialGeneratedDocument $document): LawFirmGeneratedDocumentResource
    {
        $this->assertMatchesRouteModule($request, $document);
        $this->authorize('view', $document);

        return new LawFirmGeneratedDocumentResource($this->generatedDocuments->show($document));
    }

    public function download(Request $request, NotarialGeneratedDocument $document): StreamedResponse
    {
        $this->assertMatchesRouteModule($request, $document);
        $this->authorize('view', $document);

        return $this->generatedDocuments->download($document);
    }

    public function preview(Request $request, NotarialGeneratedDocument $document): StreamedResponse
    {
        $this->assertMatchesRouteModule($request, $document);
        $this->authorize('view', $document);

        return $this->generatedDocuments->preview($document);
    }

    public function destroy(Request $request, NotarialGeneratedDocument $document): JsonResponse
    {
        $this->assertMatchesRouteModule($request, $document);
        $this->authorize('delete', $document);

        $this->generatedDocuments->delete($document);

        return response()->json(['message' => 'Generated document deleted.']);
    }

    public function editorConfig(Request $request, NotarialGeneratedDocument $document): JsonResponse
    {
        $this->assertMatchesRouteModule($request, $document);
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

    private function assertMatchesRouteModule(Request $request, NotarialGeneratedDocument $document): void
    {
        abort_unless($document->module === $this->requestedModule($request)->value, 404);
    }

    private function requestedModule(Request $request): LawFirmDocumentModule
    {
        return str_starts_with($request->path(), 'api/legal')
            ? LawFirmDocumentModule::Legal
            : LawFirmDocumentModule::Notarial;
    }
}
