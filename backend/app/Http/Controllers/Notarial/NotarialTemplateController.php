<?php

namespace App\Http\Controllers\Notarial;

use App\Actions\Notarial\CreateNotarialTemplate;
use App\Actions\Notarial\DeleteNotarialTemplate;
use App\Actions\Notarial\UpdateNotarialTemplate;
use App\Http\Controllers\Controller;
use App\Http\Requests\Notarial\NotarialTemplateIndexRequest;
use App\Http\Requests\Notarial\StoreNotarialTemplateRequest;
use App\Http\Requests\Notarial\UpdateNotarialTemplateRequest;
use App\Http\Resources\Notarial\NotarialTemplateResource;
use App\Models\NotarialTemplate;
use App\Queries\Notarial\NotarialTemplateIndexQuery;
use App\Queries\Notarial\NotarialTemplateShowQuery;
use App\Support\Legal\NotarialTemplateFileManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialTemplateController extends Controller
{
    public function __construct(
        private NotarialTemplateIndexQuery $notarialTemplateIndexQuery,
        private NotarialTemplateShowQuery $notarialTemplateShowQuery,
        private CreateNotarialTemplate $createNotarialTemplate,
        private UpdateNotarialTemplate $updateNotarialTemplate,
        private DeleteNotarialTemplate $deleteNotarialTemplate,
        private NotarialTemplateFileManager $fileManager,
    ) {}

    public function index(NotarialTemplateIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialTemplate::class);

        return NotarialTemplateResource::collection($this->notarialTemplateIndexQuery->handle($request));
    }

    public function store(StoreNotarialTemplateRequest $request): JsonResponse
    {
        $this->authorize('create', NotarialTemplate::class);

        $template = $this->createNotarialTemplate->handle(
            $request->safe()->except('file'),
            $request->user(),
            $request->file('file'),
        );

        return (new NotarialTemplateResource($template))
            ->response()
            ->setStatusCode(201);
    }

    public function show(NotarialTemplate $template): NotarialTemplateResource
    {
        $this->authorize('view', $template);

        return new NotarialTemplateResource($this->notarialTemplateShowQuery->handle($template));
    }

    public function update(UpdateNotarialTemplateRequest $request, NotarialTemplate $template): NotarialTemplateResource
    {
        $this->authorize('update', $template);

        $template = $this->updateNotarialTemplate->handle(
            $template,
            $request->safe()->except('file'),
            $request->file('file'),
        );

        return new NotarialTemplateResource($template);
    }

    public function destroy(NotarialTemplate $template): JsonResponse
    {
        $this->authorize('delete', $template);

        $this->deleteNotarialTemplate->handle($template);

        return response()->json(['message' => 'Template deleted.']);
    }

    public function download(NotarialTemplate $template): StreamedResponse
    {
        $this->authorize('view', $template);

        return $this->fileManager->download($template);
    }
}
