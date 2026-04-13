<?php

namespace App\Http\Requests;

use App\Models\ExportTransaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExportStageApplicabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'stage' => [
                'required',
                'string',
                Rule::in(ExportTransaction::optionalStageKeys()),
            ],
            'not_applicable' => ['required', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'stage.required' => 'Please select a stage to update.',
            'stage.in' => 'Only optional export stages can be marked as not applicable.',
            'not_applicable.required' => 'Please indicate whether the stage is not applicable.',
            'not_applicable.boolean' => 'The not applicable flag must be true or false.',
        ];
    }
}
