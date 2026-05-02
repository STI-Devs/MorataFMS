<?php

namespace App\Http\Requests;

use App\Enums\CountryType;
use Illuminate\Foundation\Http\FormRequest;

class CountryIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [];
    }

    public function includeInactive(): bool
    {
        return $this->boolean('include_inactive');
    }

    public function typeFilter(): ?CountryType
    {
        $type = trim((string) $this->query('type', ''));

        return $type !== '' ? CountryType::tryFrom($type) : null;
    }
}
