<?php

namespace App\Http\Requests\Notarial;

use App\Support\Legal\LegalDocumentCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNotarialTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:100', 'alpha_dash', Rule::unique('notarial_templates', 'code')],
            'label' => ['required', 'string', 'max:255'],
            'document_code' => ['required', 'string', Rule::in(LegalDocumentCatalog::documentCodes())],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['nullable', 'boolean'],
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
