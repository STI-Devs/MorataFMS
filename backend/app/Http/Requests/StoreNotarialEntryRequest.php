<?php

namespace App\Http\Requests;

use App\Models\NotarialEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNotarialEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $bookId = $this->route('book')?->id ?? $this->route('book');

        return [
            'doc_number' => [
                'required',
                'integer',
                'min:1',
                'max:525',
                Rule::unique('notarial_entries')->where(function ($query) use ($bookId) {
                    return $query->where('notarial_book_id', $bookId);
                }),
            ],
            'document_type' => ['required', 'string', Rule::in(NotarialEntry::DOCUMENT_TYPES)],
            'document_type_other' => ['nullable', 'string', 'max:255', 'required_if:document_type,other'],
            'title' => ['required', 'string', 'max:500'],
            'client_id' => ['required', 'integer', 'exists:clients,id'],
            'signer_names' => ['required', 'string', 'max:1000'],
            'id_type' => ['required', 'string', 'max:100'],
            'id_number' => ['required', 'string', 'max:100'],
            'notary_fee' => ['required', 'numeric', 'min:0', 'max:999999.99'],
            'notarized_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'doc_number.unique' => 'This document number is already used in this book.',
            'doc_number.max' => 'Document number cannot exceed 525 per book.',
            'document_type_other.required_if' => 'Please specify the document type when "Other" is selected.',
        ];
    }
}
