<?php

namespace App\Http\Requests;

use App\Enums\CountryType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100', Rule::unique('countries', 'name')],
            'code' => ['nullable', 'string', 'alpha', 'min:2', 'max:3', Rule::unique('countries', 'code')],
            'type' => ['required', Rule::enum(CountryType::class)],
        ];
    }

    protected function prepareForValidation(): void
    {
        $name = $this->input('name');
        $code = $this->input('code');

        $this->merge([
            'name' => is_string($name) ? trim($name) : $name,
            'code' => is_string($code) && trim($code) !== '' ? strtoupper(trim($code)) : null,
        ]);
    }
}
