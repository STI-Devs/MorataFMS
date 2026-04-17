<?php

namespace App\Http\Requests;

use App\Enums\CountryType;
use App\Models\Country;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCountryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var Country|null $country */
        $country = $this->route('country');

        return [
            'name' => ['required', 'string', 'max:100', Rule::unique('countries', 'name')->ignore($country?->id)],
            'code' => ['nullable', 'string', 'alpha', 'min:2', 'max:3', Rule::unique('countries', 'code')->ignore($country?->id)],
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
