<?php

namespace App\Actions\Notarial;

use App\Models\NotarialPageScan;
use App\Support\Legal\NotarialPageScanFileManager;

class DeleteNotarialPageScan
{
    public function __construct(
        private NotarialPageScanFileManager $fileManager,
    ) {}

    public function handle(NotarialPageScan $scan): void
    {
        $this->fileManager->delete($scan);
        $scan->delete();
    }
}
