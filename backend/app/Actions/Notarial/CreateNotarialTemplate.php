<?php

namespace App\Actions\Notarial;

use App\Models\NotarialTemplate;
use App\Models\User;
use App\Support\Legal\LegalDocumentCatalog;
use App\Support\Legal\NotarialTemplateFileManager;
use Illuminate\Http\UploadedFile;

class CreateNotarialTemplate
{
    public function __construct(
        private NotarialTemplateFileManager $fileManager,
    ) {}

    public function handle(array $validated, User $user, ?UploadedFile $file): NotarialTemplate
    {
        $template = new NotarialTemplate($validated);
        $template->document_category = LegalDocumentCatalog::categoryForCode($template->document_code) ?? 'other';
        $template->default_notarial_act_type = $template->default_notarial_act_type
            ?: (LegalDocumentCatalog::defaultNotarialActTypeForCode($template->document_code) ?? 'acknowledgment');
        $template->is_active = (bool) ($validated['is_active'] ?? true);
        $template->created_by = $user->id;

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
