<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExportTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by middleware/policies in controller
    }

    public function rules(): array
    {
        $id = $this->route('export_transaction')->id ?? null;

        return [
            'shipper_id' => ['required', 'integer', 'exists:clients,id'],
            'bl_no' => [
                'required',
                'string',
                'min:4',
                'max:50',
                'regex:/^[A-Za-z0-9\-]+$/',
                'unique:export_transactions,bl_no,' . $id,
            ],
            'vessel' => ['required', 'string', 'min:2', 'max:100'],
            'destination_country_id' => ['required', 'integer', 'exists:countries,id'],
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
            'destination_country_id.required' => 'Please select a destination country.',
            'destination_country_id.exists' => 'The selected destination country does not exist.',
        ];
    }
}
