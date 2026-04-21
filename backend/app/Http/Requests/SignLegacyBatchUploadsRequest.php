<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SignLegacyBatchUploadsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'relative_paths' => ['required', 'array', 'list', 'min:1', 'max:100'],
            'relative_paths.*' => ['required', 'string', 'max:1024'],
        ];
    }
}
