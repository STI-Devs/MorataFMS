<?php

namespace App\Http\Requests\LawFirmDocuments;

use App\Enums\LawFirmDocumentModule;
use App\Models\NotarialTemplate;
use App\Support\LawFirmDocuments\LawFirmDocumentCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLawFirmDocumentTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var NotarialTemplate|null $template */
        $template = $this->route('template');
        $module = $this->is('api/legal*')
            ? LawFirmDocumentModule::Legal
            : LawFirmDocumentModule::fromNullable($this->input('module', $template?->module));

        return [
            'module' => ['sometimes', Rule::in(array_column(LawFirmDocumentModule::cases(), 'value'))],
            'code' => [
                'sometimes',
                'string',
                'max:100',
                'alpha_dash',
                Rule::unique('notarial_templates', 'code')
                    ->where(fn ($query) => $query->where('module', $module->value))
                    ->ignore($template?->id),
            ],
            'label' => ['sometimes', 'string', 'max:255'],
            'document_code' => ['sometimes', 'string', Rule::in(LawFirmDocumentCatalog::documentCodesForModule($module))],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['sometimes', 'boolean'],
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
