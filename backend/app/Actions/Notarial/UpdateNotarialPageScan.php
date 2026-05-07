<?php

namespace App\Actions\Notarial;

use App\Models\NotarialPageScan;
use App\Support\Legal\NotarialPageScanFileManager;
use Illuminate\Http\UploadedFile;

class UpdateNotarialPageScan
{
    public function __construct(
        private NotarialPageScanFileManager $fileManager,
    ) {}

    public function handle(NotarialPageScan $scan, array $validated, ?UploadedFile $file): NotarialPageScan
    {
        $scan->page_start = (int) $validated['page_start'];
        $scan->page_end = (int) $validated['page_end'];

        if ($file !== null) {
            $this->fileManager->delete($scan);
            $this->fileManager->store($scan, $scan->book, $file);
        }

        $scan->save();
        $scan->load('uploadedBy');

        return $scan;
    }
}
