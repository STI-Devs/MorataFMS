<?php

namespace App\Http\Requests;

use App\Models\NotarialEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateNotarialEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $entry = $this->route('entry');
        $bookId = $entry?->notarial_book_id ?? $this->route('book');

        return [
            'doc_number' => [
                'sometimes',
                'integer',
                'min:1',
                'max:525',
                Rule::unique('notarial_entries')->where(function ($query) use ($bookId) {
                    return $query->where('notarial_book_id', $bookId);
                })->ignore($entry?->id),
            ],
            'document_type' => ['sometimes', 'string', Rule::in(NotarialEntry::DOCUMENT_TYPES)],
            'document_type_other' => ['nullable', 'string', 'max:255'],
            'title' => ['sometimes', 'string', 'max:500'],
            'client_id' => ['sometimes', 'integer', 'exists:clients,id'],
            'signer_names' => ['sometimes', 'string', 'max:1000'],
            'id_type' => ['sometimes', 'string', 'max:100'],
            'id_number' => ['sometimes', 'string', 'max:100'],
            'notary_fee' => ['sometimes', 'numeric', 'min:0', 'max:999999.99'],
            'notarized_at' => ['sometimes', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
