<?php

namespace App\Http\Requests\Notarial;

use App\Models\NotarialTemplate;
use App\Support\Legal\LegalDocumentCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateNotarialTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var NotarialTemplate|null $template */
        $template = $this->route('template');

        return [
            'code' => ['sometimes', 'string', 'max:100', 'alpha_dash', Rule::unique('notarial_templates', 'code')->ignore($template?->id)],
            'label' => ['sometimes', 'string', 'max:255'],
            'document_code' => ['sometimes', 'string', Rule::in(LegalDocumentCatalog::documentCodes())],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
            'file' => ['nullable', 'file', 'mimes:docx', 'max:51200'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.unique' => 'A document master for this document type and variant already exists.',
            'file.mimes' => 'Only DOCX template files are supported.',
        ];
    }
}
