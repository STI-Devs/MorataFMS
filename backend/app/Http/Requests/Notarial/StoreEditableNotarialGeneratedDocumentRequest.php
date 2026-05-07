<?php

namespace App\Http\Requests\Notarial;

use Illuminate\Foundation\Http\FormRequest;

class StoreEditableNotarialGeneratedDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'notarial_template_id' => ['required', 'integer', 'exists:notarial_templates,id'],
            'party_name' => ['required', 'string', 'max:255'],
            'party_id' => ['nullable', 'integer', 'exists:legal_parties,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
