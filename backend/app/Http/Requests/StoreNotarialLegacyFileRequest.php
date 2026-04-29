<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNotarialLegacyFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'files' => ['required', 'array', 'min:1'],
            'files.*' => ['required', 'file', 'max:51200', 'mimes:pdf,jpg,jpeg,png'],
        ];
    }

    public function messages(): array
    {
        return [
            'files.required' => 'Please choose one or more scanned files to upload.',
            'files.array' => 'The upload must contain one or more scanned files.',
            'files.*.max' => 'Each scanned file must not be larger than 50 MB.',
            'files.*.mimes' => 'Only PDF and image files (jpg, jpeg, png) are allowed.',
        ];
    }
}
