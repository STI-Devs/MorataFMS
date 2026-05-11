<?php

namespace App\Orchestrators\Notarial;

use App\Actions\Notarial\CreateNotarialPageScan;
use App\Actions\Notarial\DeleteNotarialPageScan;
use App\Actions\Notarial\UpdateNotarialPageScan;
use App\Models\NotarialBook;
use App\Models\NotarialPageScan;
use App\Models\User;
use App\Queries\Notarial\NotarialPageScanIndexQuery;
use App\Support\Legal\NotarialPageScanFileManager;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialPageScanOrchestrator
{
    public function __construct(
        private NotarialPageScanIndexQuery $notarialPageScanIndexQuery,
        private CreateNotarialPageScan $createNotarialPageScan,
        private UpdateNotarialPageScan $updateNotarialPageScan,
        private DeleteNotarialPageScan $deleteNotarialPageScan,
        private NotarialPageScanFileManager $fileManager,
    ) {}

    public function index(NotarialBook $book): Collection
    {
        return $this->notarialPageScanIndexQuery->handle($book);
    }

    public function store(NotarialBook $book, array $validated, User $user, UploadedFile $file): NotarialPageScan
    {
        return $this->createNotarialPageScan->handle($book, $validated, $user, $file);
    }

    public function update(NotarialPageScan $scan, array $validated, ?UploadedFile $file): NotarialPageScan
    {
        return $this->updateNotarialPageScan->handle($scan, $validated, $file);
    }

    public function delete(NotarialPageScan $scan): void
    {
        $this->deleteNotarialPageScan->handle($scan);
    }

    public function download(NotarialPageScan $scan): StreamedResponse
    {
        return $this->fileManager->download($scan);
    }
}
