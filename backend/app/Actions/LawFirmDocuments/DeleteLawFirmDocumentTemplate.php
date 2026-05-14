<?php

namespace App\Actions\LawFirmDocuments;

use App\Models\NotarialTemplate;
use App\Support\LawFirmDocuments\LawFirmDocumentTemplateFileManager;
use Symfony\Component\HttpKernel\Exception\HttpException;

class DeleteLawFirmDocumentTemplate
{
    public function __construct(
        private LawFirmDocumentTemplateFileManager $fileManager,
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
