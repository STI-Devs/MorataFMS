<?php

namespace App\Actions\Notarial;

use App\Models\NotarialTemplate;
use App\Support\Legal\LegalDocumentCatalog;
use App\Support\Legal\NotarialTemplateFileManager;
use Illuminate\Http\UploadedFile;

class UpdateNotarialTemplate
{
    public function __construct(
        private NotarialTemplateFileManager $fileManager,
    ) {}

    public function handle(NotarialTemplate $template, array $validated, ?UploadedFile $file): NotarialTemplate
    {
        $template->fill($validated);

        if ($template->document_code) {
            $template->document_category = LegalDocumentCatalog::categoryForCode($template->document_code) ?? 'other';
            $template->default_notarial_act_type = $template->default_notarial_act_type
                ?: (LegalDocumentCatalog::defaultNotarialActTypeForCode($template->document_code) ?? 'acknowledgment');
        }

        if ($file !== null) {
            $this->fileManager->store(
                $template,
                $file,
                (string) ($validated['document_code'] ?? $template->document_code ?? 'general'),
            );
        }

        $template->save();
        $template->load('createdBy');

        return $template;
    }
}
