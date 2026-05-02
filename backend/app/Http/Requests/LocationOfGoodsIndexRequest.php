<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LocationOfGoodsIndexRequest extends FormRequest
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
}
