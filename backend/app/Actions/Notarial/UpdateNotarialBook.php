<?php

namespace App\Actions\Notarial;

use App\Models\NotarialBook;
use App\Support\Legal\NotarialBookFileManager;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpKernel\Exception\HttpException;

class UpdateNotarialBook
{
    public function __construct(
        private NotarialBookFileManager $fileManager,
    ) {}

    public function handle(NotarialBook $book, array $validated, ?UploadedFile $file): NotarialBook
    {
        if (($validated['status'] ?? null) === 'active') {
            $activeBook = NotarialBook::query()
                ->where('status', 'active')
                ->where('id', '!=', $book->id)
                ->first();

            if ($activeBook !== null) {
                throw new HttpException(422, 'Another book is already active. Close it first.');
            }
        }

        $book->fill($validated);

        if (isset($validated['status'])) {
            if (in_array((string) $validated['status'], ['full', 'archived'], true) && ! $book->closed_at) {
                $book->closed_at = now();
            }

            if ($validated['status'] === 'active') {
                $book->closed_at = null;
            }
        }

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
