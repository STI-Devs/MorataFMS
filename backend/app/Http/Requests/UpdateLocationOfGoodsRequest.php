<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLocationOfGoodsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $locationOfGoods = $this->route('location_of_goods');

        return [
            'name' => [
                'required',
                'string',
                'max:150',
                Rule::unique('locations_of_goods', 'name')->ignore($locationOfGoods?->id),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        $name = $this->input('name');

        $this->merge([
            'name' => is_string($name) ? trim($name) : $name,
        ]);
    }
}
