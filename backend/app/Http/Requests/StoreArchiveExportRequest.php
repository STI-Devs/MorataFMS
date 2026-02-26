<?php

namespace App\Http\Requests;

use App\Models\Document;
use Illuminate\Foundation\Http\FormRequest;

class StoreArchiveExportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by middleware; policy checked in controller
    }

    public function rules(): array
    {
        return [
            // Transaction fields
            'bl_no' => [
                'required',
                'string',
                'min:4',
                'max:50',
                'regex:/^[A-Za-z0-9\-]+$/',
                'unique:export_transactions,bl_no',
            ],
            'vessel' => ['nullable', 'string', 'max:100'],
            'shipper_id' => ['required', 'integer', 'exists:clients,id'],
            'destination_country_id' => ['required', 'integer', 'exists:countries,id'],

            // Archive-specific: must be past/present date, and not older than year 2000
            'file_date' => ['required', 'date', 'after_or_equal:2000-01-01', 'before_or_equal:today'],

            'notes' => ['nullable', 'string', 'max:1000'],

            // Documents array (optional)
            'documents' => ['nullable', 'array'],
            'documents.*.file' => [
                'required_with:documents',
                'file',
                'max:10240',
                'mimes:pdf,jpg,jpeg,png,docx,xlsx,csv'
            ],
            'documents.*.stage' => [
                'required_with:documents',
                'string',
                'in:' . implode(',', array_keys(Document::getTypeLabels()))
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'bl_no.required' => 'Bill of Lading number is required.',
            'bl_no.min' => 'Bill of Lading number must be at least 4 characters.',
            'bl_no.regex' => 'Bill of Lading number may only contain letters, numbers, and hyphens.',
            'bl_no.unique' => 'This BL number already exists. Each shipment must have a unique BL number.',
            'shipper_id.required' => 'Please select a shipper.',
            'shipper_id.exists' => 'The selected shipper does not exist.',
            'destination_country_id.required' => 'Please select a destination country.',
            'destination_country_id.exists' => 'The selected destination country does not exist.',
            'file_date.required' => 'Archive period is required.',
            'file_date.date' => 'Archive period must be a valid date.',
            'file_date.after_or_equal' => 'Archive period cannot be before year 2000.',
            'file_date.before_or_equal' => 'Archive date cannot be in the future. Archives are for past documents only.',
            'documents.*.file.max' => 'Each file must be 10MB or less.',
            'documents.*.file.mimes' => 'Only PDF, JPG, PNG, DOCX, XLSX, and CSV files are accepted.',
        ];
    }
}
