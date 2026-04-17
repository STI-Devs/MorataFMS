<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExportTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'shipper_id' => ['required', 'integer', 'exists:clients,id'],
            'bl_no' => [
                'required',
                'string',
                'min:4',
                'max:50',
                'regex:/^[A-Za-z0-9\-]+$/',
                'unique:export_transactions,bl_no',
            ],
            'vessel' => ['required', 'string', 'min:2', 'max:100'],
            'export_date' => ['required', 'date'],
            'destination_country_id' => ['required', 'integer', 'exists:countries,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'shipper_id.required' => 'Please select a shipper.',
            'shipper_id.exists' => 'The selected shipper does not exist.',
            'bl_no.required' => 'Bill of Lading number is required.',
            'bl_no.min' => 'Bill of Lading must be at least 4 characters.',
            'bl_no.regex' => 'Bill of Lading may only contain letters, numbers, and hyphens.',
            'bl_no.unique' => 'This BL number already exists. Each shipment must have a unique BL number.',
            'vessel.required' => 'Vessel name is required.',
            'vessel.min' => 'Vessel name must be at least 2 characters.',
            'export_date.required' => 'Departure date is required.',
            'export_date.date' => 'Departure date must be a valid date.',
            'destination_country_id.required' => 'Please select a destination country.',
            'destination_country_id.exists' => 'The selected destination country does not exist.',
        ];
    }
}
