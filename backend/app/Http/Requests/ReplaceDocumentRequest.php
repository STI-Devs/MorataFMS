<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReplaceDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'max:20480',
                'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Please select a file to upload.',
            'file.uploaded' => 'The file could not be uploaded by the server. If the file is within the 20 MB app limit, increase the PHP upload limit and try again.',
            'file.file' => 'The file could not be uploaded by the server. If the file is within the 20 MB app limit, increase the PHP upload limit and try again.',
            'file.max' => 'The file must not be larger than 20 MB.',
            'file.mimes' => 'Only PDF, Office documents, and images are allowed.',
        ];
    }
}
