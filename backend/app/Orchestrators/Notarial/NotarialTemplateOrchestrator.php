<?php

namespace App\Orchestrators\Notarial;

use App\Actions\Notarial\CreateNotarialTemplate;
use App\Actions\Notarial\DeleteNotarialTemplate;
use App\Actions\Notarial\UpdateNotarialTemplate;
use App\Http\Requests\Notarial\NotarialTemplateIndexRequest;
use App\Models\NotarialTemplate;
use App\Models\User;
use App\Queries\Notarial\NotarialTemplateIndexQuery;
use App\Queries\Notarial\NotarialTemplateShowQuery;
use App\Support\Legal\NotarialTemplateFileManager;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialTemplateOrchestrator
{
    public function __construct(
        private NotarialTemplateIndexQuery $notarialTemplateIndexQuery,
        private NotarialTemplateShowQuery $notarialTemplateShowQuery,
        private CreateNotarialTemplate $createNotarialTemplate,
        private UpdateNotarialTemplate $updateNotarialTemplate,
        private DeleteNotarialTemplate $deleteNotarialTemplate,
        private NotarialTemplateFileManager $fileManager,
    ) {}

    public function index(NotarialTemplateIndexRequest $request): LengthAwarePaginator
    {
        return $this->notarialTemplateIndexQuery->handle($request);
    }

    public function store(array $validated, User $user, ?UploadedFile $file): NotarialTemplate
    {
        return $this->createNotarialTemplate->handle($validated, $user, $file);
    }

    public function show(NotarialTemplate $template): NotarialTemplate
    {
        return $this->notarialTemplateShowQuery->handle($template);
    }

    public function update(NotarialTemplate $template, array $validated, ?UploadedFile $file): NotarialTemplate
    {
        return $this->updateNotarialTemplate->handle($template, $validated, $file);
    }

    public function delete(NotarialTemplate $template): void
    {
        $this->deleteNotarialTemplate->handle($template);
    }

    public function download(NotarialTemplate $template): StreamedResponse
    {
        return $this->fileManager->download($template);
    }
}
