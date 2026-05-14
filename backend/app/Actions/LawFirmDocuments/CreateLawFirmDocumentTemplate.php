<?php

namespace App\Actions\LawFirmDocuments;

use App\Enums\LawFirmDocumentModule;
use App\Models\NotarialTemplate;
use App\Models\User;
use App\Support\LawFirmDocuments\LawFirmDocumentCatalog;
use App\Support\LawFirmDocuments\LawFirmDocumentTemplateFileManager;
use Illuminate\Http\UploadedFile;

class CreateLawFirmDocumentTemplate
{
    public function __construct(
        private LawFirmDocumentTemplateFileManager $fileManager,
    ) {}

    public function handle(array $validated, User $user, ?UploadedFile $file): NotarialTemplate
    {
        $module = LawFirmDocumentModule::fromNullable($validated['module'] ?? null);
        $template = new NotarialTemplate($validated);
        $template->module = $module->value;
        $template->document_category = LawFirmDocumentCatalog::categoryForCodeInModule($template->document_code, $module)
            ?? ($module === LawFirmDocumentModule::Legal ? 'other_legal_files' : 'other');
        $template->default_notarial_act_type = $template->default_notarial_act_type
            ?: (LawFirmDocumentCatalog::defaultNotarialActTypeForCode($template->document_code) ?? 'acknowledgment');
        $template->is_active = (bool) ($validated['is_active'] ?? true);
        $template->created_by = $user->id;

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
