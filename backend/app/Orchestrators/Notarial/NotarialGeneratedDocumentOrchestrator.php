<?php

namespace App\Orchestrators\Notarial;

use App\Actions\Notarial\CreateEditableNotarialGeneratedDocument;
use App\Actions\Notarial\DeleteNotarialGeneratedDocument;
use App\Http\Requests\Notarial\NotarialGeneratedDocumentIndexRequest;
use App\Models\NotarialGeneratedDocument;
use App\Models\User;
use App\Queries\Notarial\NotarialGeneratedDocumentIndexQuery;
use App\Support\Legal\OnlyOfficeCallbackFileFetcher;
use App\Support\Legal\OnlyOfficeDocumentEditor;
use App\Support\Legal\StoredFileDownloader;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class NotarialGeneratedDocumentOrchestrator
{
    public function __construct(
        private NotarialGeneratedDocumentIndexQuery $notarialGeneratedDocumentIndexQuery,
        private CreateEditableNotarialGeneratedDocument $createEditableNotarialGeneratedDocument,
        private DeleteNotarialGeneratedDocument $deleteNotarialGeneratedDocument,
        private StoredFileDownloader $storedFileDownloader,
        private OnlyOfficeDocumentEditor $onlyOfficeDocumentEditor,
        private OnlyOfficeCallbackFileFetcher $onlyOfficeCallbackFileFetcher,
    ) {}

    public function index(NotarialGeneratedDocumentIndexRequest $request): LengthAwarePaginator
    {
        return $this->notarialGeneratedDocumentIndexQuery->handle($request);
    }

    public function storeEditableCopy(array $validated, User $user): NotarialGeneratedDocument
    {
        return $this->createEditableNotarialGeneratedDocument->handle($validated, $user);
    }

    public function show(NotarialGeneratedDocument $document): NotarialGeneratedDocument
    {
        return $document->load(['createdBy', 'legalParty', 'template']);
    }

    public function download(NotarialGeneratedDocument $document): StreamedResponse
    {
        return $this->storedFileDownloader->download(
            (string) $document->disk,
            $document->path,
            'Generated Word file not found on storage.',
            'Generated Word file not found on storage.',
            $document->filename,
            'Unable to read the generated Word file.',
        );
    }

    public function preview(NotarialGeneratedDocument $document): StreamedResponse
    {
        return $this->storedFileDownloader->inline(
            (string) $document->disk,
            $document->path,
            'Generated Word file not found on storage.',
            'Generated Word file not found on storage.',
            $document->filename,
            'Unable to read the generated Word file.',
        );
    }

    public function delete(NotarialGeneratedDocument $document): void
    {
        $this->deleteNotarialGeneratedDocument->handle($document);
    }

    public function editorConfig(NotarialGeneratedDocument $document, User $user): array
    {
        return $this->onlyOfficeDocumentEditor->configForDocument($document, $user);
    }

    public function shouldHandleOnlyOfficeStatus(int $status): bool
    {
        return in_array($status, [2, 6], true);
    }

    public function storeOnlyOfficeCallbackFile(NotarialGeneratedDocument $document, string $editedFileUrl): bool
    {
        if ($editedFileUrl === '' || $document->path === null || $document->path === '') {
            return false;
        }

        try {
            $editedFile = $this->onlyOfficeCallbackFileFetcher->fetch($editedFileUrl);
        } catch (Throwable) {
            return false;
        }

        $disk = $this->storedFileDownloader->disk((string) $document->disk);

        if (! $disk->put($document->path, $editedFile)) {
            return false;
        }

        $document->forceFill([
            'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'size_bytes' => strlen($editedFile),
            'generated_at' => now(),
        ])->save();

        return true;
    }
}
