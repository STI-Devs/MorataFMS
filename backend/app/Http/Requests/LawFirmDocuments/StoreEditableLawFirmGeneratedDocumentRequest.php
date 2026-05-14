<?php

namespace App\Http\Requests\LawFirmDocuments;

use App\Enums\LawFirmDocumentModule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEditableLawFirmGeneratedDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'module' => ['nullable', Rule::in(array_column(LawFirmDocumentModule::cases(), 'value'))],
            'notarial_template_id' => ['required', 'integer', 'exists:notarial_templates,id'],
            'party_name' => ['required', 'string', 'max:255'],
            'party_id' => ['nullable', 'integer', 'exists:legal_parties,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->is('api/legal*')) {
            $this->merge(['module' => LawFirmDocumentModule::Legal->value]);
        }
    }
}
