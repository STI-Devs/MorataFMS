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
            'customs_ref_no' => ['required', 'string', 'max:50'],
            'bl_no' => ['required', 'string', 'max:50'],
            'selective_color' => ['required', 'in:green,yellow,red'],
            'importer_id' => ['required', 'exists:clients,id'],
            'origin_country_id' => ['nullable', 'exists:countries,id'],
            'arrival_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'customs_ref_no.required' => 'Customs Reference No. is required.',
            'bl_no.required' => 'Bill of Lading number is required.',
            'selective_color.required' => 'Selective Color (BLSC) is required.',
            'selective_color.in' => 'Selective Color must be green, yellow, or red.',
            'importer_id.required' => 'Please select an importer.',
            'importer_id.exists' => 'The selected importer does not exist.',
            'origin_country_id.exists' => 'The selected country of origin does not exist.',
            'arrival_date.required' => 'Arrival date is required.',
            'arrival_date.date' => 'Arrival date must be a valid date.',
        ];
    }
}
