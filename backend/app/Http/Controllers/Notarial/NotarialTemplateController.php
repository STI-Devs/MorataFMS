<?php

namespace App\Http\Controllers\Notarial;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notarial\NotarialTemplateIndexRequest;
use App\Http\Requests\Notarial\StoreNotarialTemplateRequest;
use App\Http\Requests\Notarial\UpdateNotarialTemplateRequest;
use App\Http\Resources\Notarial\NotarialTemplateResource;
use App\Models\NotarialTemplate;
use App\Orchestrators\Notarial\NotarialTemplateOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialTemplateController extends Controller
{
    public function __construct(
        private NotarialTemplateOrchestrator $templates,
    ) {}

    public function index(NotarialTemplateIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialTemplate::class);

        return NotarialTemplateResource::collection($this->templates->index($request));
    }

    public function store(StoreNotarialTemplateRequest $request): JsonResponse
    {
        $this->authorize('create', NotarialTemplate::class);

        return (new NotarialTemplateResource(
            $this->templates->store(
                $request->safe()->except('file'),
                $request->user(),
                $request->file('file'),
            )
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function show(NotarialTemplate $template): NotarialTemplateResource
    {
        $this->authorize('view', $template);

        return new NotarialTemplateResource($this->templates->show($template));
    }

    public function update(UpdateNotarialTemplateRequest $request, NotarialTemplate $template): NotarialTemplateResource
    {
        $this->authorize('update', $template);

        return new NotarialTemplateResource(
            $this->templates->update(
                $template,
                $request->safe()->except('file'),
                $request->file('file'),
            )
        );
    }

    public function destroy(NotarialTemplate $template): JsonResponse
    {
        $this->authorize('delete', $template);

        $this->templates->delete($template);

        return response()->json(['message' => 'Template deleted.']);
    }

    public function download(NotarialTemplate $template): StreamedResponse
    {
        $this->authorize('view', $template);

        return $this->templates->download($template);
    }
}
