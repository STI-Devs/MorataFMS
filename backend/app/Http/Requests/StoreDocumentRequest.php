<?php

namespace App\Http\Requests;

use App\Models\Document;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by controller via policy
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
                'max:10240', // 10 MB in kilobytes
                'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png',
            ],
            'type' => [
                'required',
                'string',
                Rule::in(array_keys(Document::getTypeLabels())),
            ],
            'documentable_type' => [
                'required',
                'string',
                Rule::in(['App\Models\ImportTransaction', 'App\Models\ExportTransaction']),
            ],
            'documentable_id' => [
                'required',
                'integer',
                function ($attribute, $value, $fail) {
                    $type = $this->input('documentable_type');
                    if (!$type || !class_exists($type)) {
                        $fail('Invalid documentable type.');
                        return;
                    }
                    if (!$type::where('id', $value)->exists()) {
                        $fail('The selected transaction does not exist.');
                    }
                },
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
            'file.max' => 'The file must not be larger than 10 MB.',
            'file.mimes' => 'Only PDF, Office documents, and images are allowed.',
            'type.in' => 'Invalid document type selected.',
            'documentable_type.in' => 'Invalid transaction type.',
        ];
    }
}
