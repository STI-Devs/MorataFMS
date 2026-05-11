<?php

namespace App\Http\Controllers\Documents;

use App\Http\Controllers\Controller;
use App\Http\Requests\Documents\ReplaceDocumentRequest;
use App\Http\Requests\Documents\StoreDocumentRequest;
use App\Http\Requests\Documents\StoreVesselBillingDocumentsRequest;
use App\Http\Resources\Documents\DocumentResource;
use App\Models\Document;
use App\Orchestrators\Documents\DocumentOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    public function __construct(
        private DocumentOrchestrator $documents,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Document::class);

        return DocumentResource::collection($this->documents->index($request));
    }

    public function transactions(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Document::class);

        return response()->json($this->documents->transactions($request));
    }

    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $transaction = $this->documents->documentableFor($request);

        $this->authorize('create', [Document::class, $transaction]);

        return (new DocumentResource($this->documents->store($request, $transaction)))
            ->response()
            ->setStatusCode(201);
    }

    public function storeVesselBilling(StoreVesselBillingDocumentsRequest $request): JsonResponse
    {
        $transaction = $this->documents->documentableFor($request);

        $this->authorize('create', [Document::class, $transaction]);

        return response()->json([
            'data' => $this->documents->storeVesselBilling($request, $transaction),
        ], 201);
    }

    public function show(Document $document): DocumentResource
    {
        $this->authorize('view', $document);

        return new DocumentResource($this->documents->show($document));
    }

    public function preview(Document $document): StreamedResponse
    {
        $this->authorize('view', $document);

        return $this->documents->preview($document);
    }

    public function stream(Document $document): StreamedResponse
    {
        $this->authorize('view', $document);

        return $this->documents->stream($document);
    }

    public function download(Document $document): StreamedResponse
    {
        $this->authorize('view', $document);

        return $this->documents->download($document);
    }

    public function destroy(Request $request, Document $document): Response
    {
        $this->authorize('delete', $document);

        $this->documents->delete($document, $request->user());

        return response()->noContent();
    }

    public function replace(ReplaceDocumentRequest $request, Document $document): JsonResponse
    {
        $this->authorize('replace', $document);

        return (new DocumentResource($this->documents->replace($request, $document)))
            ->response()
            ->setStatusCode(201);
    }
}
