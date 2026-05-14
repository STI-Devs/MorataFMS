<?php

namespace App\Http\Requests\LawFirmDocuments;

use App\Enums\LawFirmDocumentModule;
use App\Support\LawFirmDocuments\LawFirmDocumentCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLawFirmDocumentTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $module = $this->is('api/legal*')
            ? LawFirmDocumentModule::Legal
            : LawFirmDocumentModule::fromNullable($this->input('module'));

        return [
            'module' => ['nullable', Rule::in(array_column(LawFirmDocumentModule::cases(), 'value'))],
            'code' => [
                'required',
                'string',
                'max:100',
                'alpha_dash',
                Rule::unique('notarial_templates', 'code')
                    ->where(fn ($query) => $query->where('module', $module->value)),
            ],
            'label' => ['required', 'string', 'max:255'],
            'document_code' => ['required', 'string', Rule::in(LawFirmDocumentCatalog::documentCodesForModule($module))],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['nullable', 'boolean'],
            'file' => ['nullable', 'file', 'mimes:docx', 'max:51200'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->is('api/legal*')) {
            $this->merge(['module' => LawFirmDocumentModule::Legal->value]);
        }
    }

    public function messages(): array
    {
        return [
            'code.unique' => 'A document master for this document type and variant already exists.',
            'file.mimes' => 'Only DOCX template files are supported.',
        ];
    }
}
