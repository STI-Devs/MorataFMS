<?php

namespace App\Http\Requests;

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

    protected function prepareForValidation(): void
    {
        $fieldSchema = $this->input('field_schema');

        if (is_string($fieldSchema) && $fieldSchema !== '') {
            $decoded = json_decode($fieldSchema, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                $this->merge([
                    'field_schema' => $decoded,
                ]);
            }
        }
    }

    public function rules(): array
    {
        /** @var NotarialTemplate|null $template */
        $template = $this->route('template');

        return [
            'code' => ['sometimes', 'string', 'max:100', 'alpha_dash', Rule::unique('notarial_templates', 'code')->ignore($template?->id)],
            'label' => ['sometimes', 'string', 'max:255'],
            'document_code' => ['sometimes', 'string', Rule::in(LegalDocumentCatalog::documentCodes())],
            'default_notarial_act_type' => ['sometimes', 'string', Rule::in(array_column(LegalDocumentCatalog::notarialActTypes(), 'code'))],
            'description' => ['nullable', 'string', 'max:2000'],
            'field_schema' => ['sometimes', 'array', 'min:1'],
            'field_schema.*.name' => ['required_with:field_schema', 'string', 'max:100', 'alpha_dash'],
            'field_schema.*.label' => ['required_with:field_schema', 'string', 'max:255'],
            'field_schema.*.type' => ['required_with:field_schema', 'string', Rule::in(array_column(LegalDocumentCatalog::templateFieldTypes(), 'code'))],
            'field_schema.*.required' => ['required_with:field_schema', 'boolean'],
            'field_schema.*.placeholder' => ['nullable', 'string', 'max:255'],
            'field_schema.*.help_text' => ['nullable', 'string', 'max:500'],
            'field_schema.*.options' => ['nullable', 'array'],
            'field_schema.*.options.*' => ['required_with:field_schema.*.options', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'file' => ['nullable', 'file', 'mimes:docx', 'max:51200'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.unique' => 'This template code already exists.',
            'file.mimes' => 'Only DOCX template files are supported.',
        ];
    }
}
