<?php

namespace App\Actions\Notarial;

use App\Models\NotarialBook;
use App\Models\User;
use App\Support\Legal\NotarialBookFileManager;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CreateNotarialBook
{
    public function __construct(
        private NotarialBookFileManager $fileManager,
    ) {}

    public function handle(array $validated, User $user, ?UploadedFile $file): NotarialBook
    {
        $status = trim((string) ($validated['status'] ?? '')) ?: 'archived';

        if ($status === 'active') {
            $activeBook = NotarialBook::query()->where('status', 'active')->first();

            if ($activeBook !== null) {
                throw new HttpException(
                    422,
                    'There is already an active book (Book '.$activeBook->book_number.', '.$activeBook->year.'). Archive or close it first.',
                );
            }
        }

        $book = new NotarialBook($validated);
        $book->status = $status;
        $book->opened_at = now();
        $book->closed_at = in_array($status, ['full', 'archived'], true) ? now() : null;
        $book->created_by = $user->id;

        if ($file !== null) {
            $this->fileManager->store(
                $book,
                $file,
                (int) ($validated['year'] ?? $book->year ?? now()->year),
                $validated['book_number'] ?? $book->book_number ?? 'unknown',
            );
        }

        $book->save();
        $book->load('createdBy')->loadCount(['pageScans', 'legacyFiles']);

        return $book;
    }
}
