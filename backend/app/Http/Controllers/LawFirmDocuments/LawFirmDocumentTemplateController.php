<?php

namespace App\Http\Controllers\LawFirmDocuments;

use App\Enums\LawFirmDocumentModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\LawFirmDocuments\LawFirmDocumentTemplateIndexRequest;
use App\Http\Requests\LawFirmDocuments\StoreLawFirmDocumentTemplateRequest;
use App\Http\Requests\LawFirmDocuments\UpdateLawFirmDocumentTemplateRequest;
use App\Http\Resources\LawFirmDocuments\LawFirmDocumentTemplateResource;
use App\Models\NotarialTemplate;
use App\Orchestrators\LawFirmDocuments\LawFirmDocumentTemplateOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LawFirmDocumentTemplateController extends Controller
{
    public function __construct(
        private LawFirmDocumentTemplateOrchestrator $templates,
    ) {}

    public function index(LawFirmDocumentTemplateIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialTemplate::class);

        return LawFirmDocumentTemplateResource::collection($this->templates->index($request));
    }

    public function store(StoreLawFirmDocumentTemplateRequest $request): JsonResponse
    {
        $this->authorize('create', NotarialTemplate::class);

        return (new LawFirmDocumentTemplateResource(
            $this->templates->store(
                $request->safe()->except('file'),
                $request->user(),
                $request->file('file'),
            )
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, NotarialTemplate $template): LawFirmDocumentTemplateResource
    {
        $this->assertMatchesRouteModule($request, $template);
        $this->authorize('view', $template);

        return new LawFirmDocumentTemplateResource($this->templates->show($template));
    }

    public function update(UpdateLawFirmDocumentTemplateRequest $request, NotarialTemplate $template): LawFirmDocumentTemplateResource
    {
        $this->assertMatchesRouteModule($request, $template);
        $this->authorize('update', $template);

        return new LawFirmDocumentTemplateResource(
            $this->templates->update(
                $template,
                $request->safe()->except('file'),
                $request->file('file'),
            )
        );
    }

    public function destroy(Request $request, NotarialTemplate $template): JsonResponse
    {
        $this->assertMatchesRouteModule($request, $template);
        $this->authorize('delete', $template);

        $this->templates->delete($template);

        return response()->json(['message' => 'Template deleted.']);
    }

    public function download(Request $request, NotarialTemplate $template): StreamedResponse
    {
        $this->assertMatchesRouteModule($request, $template);
        $this->authorize('view', $template);

        return $this->templates->download($template);
    }

    private function assertMatchesRouteModule(Request $request, NotarialTemplate $template): void
    {
        abort_unless($template->module === $this->requestedModule($request)->value, 404);
    }

    private function requestedModule(Request $request): LawFirmDocumentModule
    {
        return str_starts_with($request->path(), 'api/legal')
            ? LawFirmDocumentModule::Legal
            : LawFirmDocumentModule::Notarial;
    }
}
