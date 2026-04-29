<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateNotarialBookRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $book = $this->route('book');

        return [
            'book_number' => [
                'sometimes',
                'integer',
                'min:1',
                Rule::unique('notarial_books')->where(function ($query) use ($book) {
                    return $query->where('year', $this->input('year', $book?->year));
                })->ignore($book?->id),
            ],
            'year' => ['sometimes', 'integer', 'min:2000', 'max:2100'],
            'status' => ['sometimes', 'string', 'in:active,full,archived'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:51200'],
        ];
    }
}
