<?php

namespace App\Actions\Notarial;

use App\Models\NotarialLegacyFile;
use App\Support\Legal\NotarialLegacyFileManager;

class DeleteNotarialLegacyFile
{
    public function __construct(
        private NotarialLegacyFileManager $fileManager,
    ) {}

    public function handle(NotarialLegacyFile $legacyFile): void
    {
        $this->fileManager->delete($legacyFile);
        $legacyFile->delete();
    }
}
