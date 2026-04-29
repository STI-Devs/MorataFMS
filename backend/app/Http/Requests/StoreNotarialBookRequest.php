<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNotarialBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'book_number' => [
                'required',
                'integer',
                'min:1',
                Rule::unique('notarial_books')->where(function ($query) {
                    return $query->where('year', $this->input('year', now()->year));
                }),
            ],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'status' => ['nullable', 'string', 'in:active,full,archived'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:51200'],
        ];
    }

    public function messages(): array
    {
        return [
            'book_number.unique' => 'A book with this number already exists for the selected year.',
        ];
    }
}
