<?php

namespace App\Actions\Notarial;

use App\Models\NotarialBook;
use App\Models\NotarialLegacyFile;
use App\Models\User;
use App\Support\Legal\NotarialLegacyFileManager;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;

class StoreNotarialLegacyFiles
{
    public function __construct(
        private NotarialLegacyFileManager $fileManager,
    ) {}

    /**
     * @param  array<int, UploadedFile|null>  $files
     * @return Collection<int, NotarialLegacyFile>
     */
    public function handle(NotarialBook $book, array $files, User $user): Collection
    {
        $storedFiles = collect();

        foreach ($files as $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            $legacyFile = new NotarialLegacyFile;
            $legacyFile->notarial_book_id = $book->id;
            $legacyFile->uploaded_by = $user->id;

            $this->fileManager->store($legacyFile, $book, $file);

            $legacyFile->save();
            $legacyFile->load('uploadedBy');

            $storedFiles->push($legacyFile);
        }

        return $storedFiles;
    }
}
