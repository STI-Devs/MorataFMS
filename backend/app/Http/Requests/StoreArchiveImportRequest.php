<?php

namespace App\Http\Requests;

use App\Enums\SelectiveColor;
use App\Models\Document;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class StoreArchiveImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by middleware; policy checked in controller
    }

    public function rules(): array
    {
        return [
            // Transaction fields
            'customs_ref_no' => [
                'nullable',
                'string',
                'max:50',
                'regex:/^[A-Za-z0-9\-\/]+$/',
                Rule::unique('import_transactions', 'customs_ref_no'),
            ],
            'bl_no' => [
                'required',
                'string',
                'min:4',
                'max:50',
                'regex:/^[A-Za-z0-9\-]+$/',
                Rule::unique('import_transactions', 'bl_no'),
            ],
            'selective_color' => ['required', new Enum(SelectiveColor::class)],
            'importer_id' => ['required', 'integer', 'exists:clients,id'],
            'origin_country_id' => ['nullable', 'integer', 'exists:countries,id'],

            // Archive-specific: must be past/present date, and not older than year 2000
            'file_date' => ['required', 'date', 'after_or_equal:2000-01-01', 'before_or_equal:today'],

            'notes' => ['nullable', 'string', 'max:1000'],

            // Documents array (optional — submitted as multipart)
            'documents' => ['nullable', 'array'],
            'documents.*.file' => [
                'required_with:documents',
                'file',
                'max:10240',
                'mimes:pdf,jpg,jpeg,png,docx,xlsx,csv',
            ],
            'documents.*.stage' => [
                'required_with:documents',
                'string',
                Rule::in(Document::importTypeKeys()),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'customs_ref_no.regex' => 'Customs Ref No. may only contain letters, numbers, hyphens, and slashes.',
            'customs_ref_no.unique' => 'This Customs Reference No. already exists. Tracking references must be unique.',
            'bl_no.required' => 'Bill of Lading number is required.',
            'bl_no.min' => 'Bill of Lading number must be at least 4 characters.',
            'bl_no.regex' => 'Bill of Lading number may only contain letters, numbers, and hyphens.',
            'bl_no.unique' => 'This BL number already exists. Each shipment must have a unique BL number.',
            'selective_color.required' => 'Selective Color (BLSC) is required.',
            'importer_id.required' => 'Please select an importer.',
            'importer_id.exists' => 'The selected importer does not exist.',
            'origin_country_id.exists' => 'The selected country of origin does not exist.',
            'file_date.required' => 'Archive period is required.',
            'file_date.date' => 'Archive period must be a valid date.',
            'file_date.after_or_equal' => 'Archive period cannot be before year 2000.',
            'file_date.before_or_equal' => 'Archive date cannot be in the future. Archives are for past documents only.',
            'documents.*.file.max' => 'Each file must be 10MB or less.',
            'documents.*.file.mimes' => 'Only PDF, JPG, PNG, DOCX, XLSX, and CSV files are accepted.',
        ];
    }
}
