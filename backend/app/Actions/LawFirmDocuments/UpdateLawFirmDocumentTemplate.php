<?php

namespace App\Actions\LawFirmDocuments;

use App\Enums\LawFirmDocumentModule;
use App\Models\NotarialTemplate;
use App\Support\LawFirmDocuments\LawFirmDocumentCatalog;
use App\Support\LawFirmDocuments\LawFirmDocumentTemplateFileManager;
use Illuminate\Http\UploadedFile;

class UpdateLawFirmDocumentTemplate
{
    public function __construct(
        private LawFirmDocumentTemplateFileManager $fileManager,
    ) {}

    public function handle(NotarialTemplate $template, array $validated, ?UploadedFile $file): NotarialTemplate
    {
        $template->fill($validated);
        $module = LawFirmDocumentModule::fromNullable($template->module);

        if ($template->document_code) {
            $template->document_category = LawFirmDocumentCatalog::categoryForCodeInModule($template->document_code, $module)
                ?? ($module === LawFirmDocumentModule::Legal ? 'other_legal_files' : 'other');
            $template->default_notarial_act_type = $template->default_notarial_act_type
                ?: (LawFirmDocumentCatalog::defaultNotarialActTypeForCode($template->document_code) ?? 'acknowledgment');
        }

        if ($file !== null) {
            $this->fileManager->store(
                $template,
                $file,
                (string) ($validated['document_code'] ?? $template->document_code ?? 'general'),
                $module,
            );
        }

        $template->save();
        $template->load('createdBy');

        return $template;
    }
}
