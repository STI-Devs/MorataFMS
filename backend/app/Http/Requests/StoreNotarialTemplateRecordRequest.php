<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNotarialTemplateRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'notarial_template_id' => ['required', 'integer', 'exists:notarial_templates,id'],
            'notarial_book_id' => ['nullable', 'integer', 'exists:notarial_books,id'],
            'party_name' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'template_data' => ['required', 'array', 'min:1'],
        ];
    }
}
