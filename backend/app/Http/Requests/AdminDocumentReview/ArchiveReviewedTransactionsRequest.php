<?php

namespace App\Http\Requests\AdminDocumentReview;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ArchiveReviewedTransactionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'transactions' => ['required', 'array', 'min:1', 'max:100'],
            'transactions.*.type' => ['required', Rule::in(['import', 'export'])],
            'transactions.*.id' => ['required', 'integer', 'min:1', 'distinct'],
        ];
    }
}
