<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRemarkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'severity' => ['required', 'in:info,warning,critical'],
            'message' => ['required', 'string', 'max:1000'],
            'document_id' => ['nullable', 'integer', 'exists:documents,id'],
        ];
    }
}
