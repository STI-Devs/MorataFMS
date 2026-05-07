<?php

namespace App\Actions\Notarial;

use App\Models\NotarialBook;
use App\Models\NotarialPageScan;
use App\Models\User;
use App\Support\Legal\NotarialPageScanFileManager;
use Illuminate\Http\UploadedFile;

class CreateNotarialPageScan
{
    public function __construct(
        private NotarialPageScanFileManager $fileManager,
    ) {}

    public function handle(NotarialBook $book, array $validated, User $user, UploadedFile $file): NotarialPageScan
    {
        $scan = new NotarialPageScan([
            'page_start' => (int) $validated['page_start'],
            'page_end' => (int) $validated['page_end'],
        ]);
        $scan->notarial_book_id = $book->id;
        $scan->uploaded_by = $user->id;

        $this->fileManager->store($scan, $book, $file);

        $scan->save();
        $scan->load('uploadedBy');

        return $scan;
    }
}
