<?php

namespace App\Http\Requests;

use App\Support\Legal\LegalDocumentCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNotarialTemplateRequest extends FormRequest
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
        return [
            'code' => ['required', 'string', 'max:100', 'alpha_dash', Rule::unique('notarial_templates', 'code')],
            'label' => ['required', 'string', 'max:255'],
            'document_code' => ['required', 'string', Rule::in(LegalDocumentCatalog::documentCodes())],
            'default_notarial_act_type' => ['nullable', 'string', Rule::in(array_column(LegalDocumentCatalog::notarialActTypes(), 'code'))],
            'description' => ['nullable', 'string', 'max:2000'],
            'field_schema' => ['required', 'array', 'min:1'],
            'field_schema.*.name' => ['required', 'string', 'max:100', 'alpha_dash'],
            'field_schema.*.label' => ['required', 'string', 'max:255'],
            'field_schema.*.type' => ['required', 'string', Rule::in(array_column(LegalDocumentCatalog::templateFieldTypes(), 'code'))],
            'field_schema.*.required' => ['required', 'boolean'],
            'field_schema.*.placeholder' => ['nullable', 'string', 'max:255'],
            'field_schema.*.help_text' => ['nullable', 'string', 'max:500'],
            'field_schema.*.options' => ['nullable', 'array'],
            'field_schema.*.options.*' => ['required_with:field_schema.*.options', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
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
