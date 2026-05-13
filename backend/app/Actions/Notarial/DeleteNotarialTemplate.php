<?php

namespace App\Actions\Notarial;

use App\Models\NotarialTemplate;
use App\Support\Legal\NotarialTemplateFileManager;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DeleteNotarialTemplate
{
    public function __construct(
        private NotarialTemplateFileManager $fileManager,
    ) {}

    public function handle(NotarialTemplate $template): void
    {
        if ($template->generatedDocuments()->exists()) {
            throw new HttpException(409, 'Generated records already exist for this template. Archive it instead of deleting.');
        }

        $this->fileManager->delete($template);
        $template->delete();
    }
}
