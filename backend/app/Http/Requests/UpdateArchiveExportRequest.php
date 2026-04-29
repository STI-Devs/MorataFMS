<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateArchiveExportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $transactionId = $this->route('transaction')?->id;

        return [
            'bl_no' => [
                'required',
                'string',
                'min:4',
                'max:50',
                'regex:/^[A-Za-z0-9\-]+$/',
                Rule::unique('export_transactions', 'bl_no')->ignore($transactionId),
            ],
            'vessel' => ['nullable', 'string', 'max:100'],
            'shipper_id' => ['required', 'integer', 'exists:brokerage_clients,id'],
            'destination_country_id' => ['required', 'integer', 'exists:countries,id'],
            'file_date' => ['required', 'date', 'after_or_equal:2000-01-01', 'before_or_equal:today'],
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
        ];
    }
}
