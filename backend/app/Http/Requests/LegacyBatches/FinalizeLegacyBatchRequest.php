<?php

namespace App\Http\Requests\LegacyBatches;

use Illuminate\Foundation\Http\FormRequest;

class FinalizeLegacyBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [];
    }
}
