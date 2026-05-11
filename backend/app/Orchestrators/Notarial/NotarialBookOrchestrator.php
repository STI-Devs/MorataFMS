<?php

namespace App\Orchestrators\Notarial;

use App\Actions\Notarial\CreateNotarialBook;
use App\Actions\Notarial\DeleteNotarialBook;
use App\Actions\Notarial\UpdateNotarialBook;
use App\Http\Requests\Notarial\NotarialBookIndexRequest;
use App\Models\NotarialBook;
use App\Models\User;
use App\Queries\Notarial\NotarialBookIndexQuery;
use App\Queries\Notarial\NotarialBookShowQuery;
use App\Support\Legal\NotarialBookFileManager;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialBookOrchestrator
{
    public function __construct(
        private NotarialBookIndexQuery $notarialBookIndexQuery,
        private NotarialBookShowQuery $notarialBookShowQuery,
        private CreateNotarialBook $createNotarialBook,
        private UpdateNotarialBook $updateNotarialBook,
        private DeleteNotarialBook $deleteNotarialBook,
        private NotarialBookFileManager $fileManager,
    ) {}

    public function index(NotarialBookIndexRequest $request): LengthAwarePaginator
    {
        return $this->notarialBookIndexQuery->handle($request);
    }

    public function show(NotarialBook $book): NotarialBook
    {
        return $this->notarialBookShowQuery->handle($book);
    }

    public function store(array $validated, User $user, ?UploadedFile $file): NotarialBook
    {
        return $this->createNotarialBook->handle($validated, $user, $file);
    }

    public function update(NotarialBook $book, array $validated, ?UploadedFile $file): NotarialBook
    {
        return $this->updateNotarialBook->handle($book, $validated, $file);
    }

    public function delete(NotarialBook $book): void
    {
        $this->deleteNotarialBook->handle($book);
    }

    public function downloadScan(NotarialBook $book): StreamedResponse
    {
        return $this->fileManager->download($book);
    }
}
