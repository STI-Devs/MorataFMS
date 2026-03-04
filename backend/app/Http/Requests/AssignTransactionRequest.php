<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled in controller via $this->authorize()
    }

    public function rules(): array
    {
        return [
            'assigned_user_id' => ['required', 'integer', 'exists:users,id'],
        ];
    }
}
