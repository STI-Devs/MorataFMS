<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreImportTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by middleware
    }

    public function rules(): array
    {
        return [
            'customs_ref_no' => ['required', 'string', 'max:50', 'regex:/^[A-Za-z0-9\-\/]+$/'],
            'bl_no' => [
                'required',
                'string',
                'min:4',
                'max:50',
                'regex:/^[A-Za-z0-9\-]+$/',
                'unique:import_transactions,bl_no',
            ],
            'selective_color' => ['required', 'in:green,yellow,red'],
            'importer_id' => ['required', 'integer', 'exists:clients,id'],
            'origin_country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'arrival_date' => ['required', 'date', 'after_or_equal:2000-01-01'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'customs_ref_no.required' => 'Customs Reference No. is required.',
            'customs_ref_no.regex' => 'Customs Ref No. may only contain letters, numbers, hyphens, and slashes.',
            'bl_no.required' => 'Bill of Lading number is required.',
            'bl_no.min' => 'Bill of Lading must be at least 4 characters.',
            'bl_no.regex' => 'Bill of Lading may only contain letters, numbers, and hyphens.',
            'bl_no.unique' => 'This BL number already exists. Each shipment must have a unique BL number.',
            'selective_color.required' => 'Selective Color (BLSC) is required.',
            'selective_color.in' => 'Selective Color must be green, yellow, or red.',
            'importer_id.required' => 'Please select an importer.',
            'importer_id.exists' => 'The selected importer does not exist.',
            'origin_country_id.exists' => 'The selected country of origin does not exist.',
            'arrival_date.required' => 'Arrival date is required.',
            'arrival_date.date' => 'Arrival date must be a valid date.',
            'arrival_date.after_or_equal' => 'Arrival date cannot be before year 2000.',
        ];
    }
}
