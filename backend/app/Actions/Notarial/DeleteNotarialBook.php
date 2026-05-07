<?php

namespace App\Actions\Notarial;

use App\Models\NotarialBook;
use App\Support\Legal\NotarialBookFileManager;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DeleteNotarialBook
{
    public function __construct(
        private NotarialBookFileManager $fileManager,
    ) {}

    public function handle(NotarialBook $book): void
    {
        if ($book->pageScans()->exists() || $book->legacyFiles()->exists()) {
            throw new HttpException(
                409,
                'This book already has uploaded scans or archive files. Clear those items before deleting the book.',
            );
        }

        $this->fileManager->delete($book);
        $book->delete();
    }
}
