<?php

namespace App\Orchestrators\LawFirmDocuments;

use App\Actions\LawFirmDocuments\CreateLawFirmDocumentTemplate;
use App\Actions\LawFirmDocuments\DeleteLawFirmDocumentTemplate;
use App\Actions\LawFirmDocuments\UpdateLawFirmDocumentTemplate;
use App\Http\Requests\LawFirmDocuments\LawFirmDocumentTemplateIndexRequest;
use App\Models\NotarialTemplate;
use App\Models\User;
use App\Queries\LawFirmDocuments\LawFirmDocumentTemplateIndexQuery;
use App\Queries\LawFirmDocuments\LawFirmDocumentTemplateShowQuery;
use App\Support\LawFirmDocuments\LawFirmDocumentTemplateFileManager;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LawFirmDocumentTemplateOrchestrator
{
    public function __construct(
        private LawFirmDocumentTemplateIndexQuery $lawFirmDocumentTemplateIndexQuery,
        private LawFirmDocumentTemplateShowQuery $lawFirmDocumentTemplateShowQuery,
        private CreateLawFirmDocumentTemplate $createLawFirmDocumentTemplate,
        private UpdateLawFirmDocumentTemplate $updateLawFirmDocumentTemplate,
        private DeleteLawFirmDocumentTemplate $deleteLawFirmDocumentTemplate,
        private LawFirmDocumentTemplateFileManager $fileManager,
    ) {}

    public function index(LawFirmDocumentTemplateIndexRequest $request): LengthAwarePaginator
    {
        return $this->lawFirmDocumentTemplateIndexQuery->handle($request);
    }

    public function store(array $validated, User $user, ?UploadedFile $file): NotarialTemplate
    {
        return $this->createLawFirmDocumentTemplate->handle($validated, $user, $file);
    }

    public function show(NotarialTemplate $template): NotarialTemplate
    {
        return $this->lawFirmDocumentTemplateShowQuery->handle($template);
    }

    public function update(NotarialTemplate $template, array $validated, ?UploadedFile $file): NotarialTemplate
    {
        return $this->updateLawFirmDocumentTemplate->handle($template, $validated, $file);
    }

    public function delete(NotarialTemplate $template): void
    {
        $this->deleteLawFirmDocumentTemplate->handle($template);
    }

    public function download(NotarialTemplate $template): StreamedResponse
    {
        return $this->fileManager->download($template);
    }
}
