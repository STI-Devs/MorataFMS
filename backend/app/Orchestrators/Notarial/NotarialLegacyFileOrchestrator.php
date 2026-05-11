<?php

namespace App\Orchestrators\Notarial;

use App\Actions\Notarial\DeleteNotarialLegacyFile;
use App\Actions\Notarial\StoreNotarialLegacyFiles;
use App\Models\NotarialBook;
use App\Models\NotarialLegacyFile;
use App\Models\User;
use App\Queries\Notarial\NotarialLegacyFileIndexQuery;
use App\Support\Legal\NotarialLegacyFileManager;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialLegacyFileOrchestrator
{
    public function __construct(
        private NotarialLegacyFileIndexQuery $notarialLegacyFileIndexQuery,
        private StoreNotarialLegacyFiles $storeNotarialLegacyFiles,
        private DeleteNotarialLegacyFile $deleteNotarialLegacyFile,
        private NotarialLegacyFileManager $fileManager,
    ) {}

    public function index(NotarialBook $book): Collection
    {
        return $this->notarialLegacyFileIndexQuery->handle($book);
    }

    public function store(NotarialBook $book, array $files, User $user): Collection
    {
        return $this->storeNotarialLegacyFiles->handle($book, $files, $user);
    }

    public function delete(NotarialLegacyFile $legacyFile): void
    {
        $this->deleteNotarialLegacyFile->handle($legacyFile);
    }

    public function download(NotarialLegacyFile $legacyFile): StreamedResponse
    {
        return $this->fileManager->download($legacyFile);
    }
}
