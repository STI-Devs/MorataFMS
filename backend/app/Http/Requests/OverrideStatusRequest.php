<?php

namespace App\Http\Requests;

use App\Support\Transactions\ExportStatusWorkflow;
use App\Support\Transactions\ImportStatusWorkflow;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OverrideStatusRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $status = $this->input('status');

        if ($this->route('importTransaction')) {
            $status = ImportStatusWorkflow::normalize($status);
        }

        if ($this->route('exportTransaction')) {
            $status = ExportStatusWorkflow::normalize($status);
        }

        $this->merge([
            'status' => $status,
        ]);
    }

    public function authorize(): bool
    {
        return true; // Authorization handled in controller via $this->authorize()
    }

    public function rules(): array
    {
        $allowedStatuses = $this->route('importTransaction')
            ? ImportStatusWorkflow::all()
            : ExportStatusWorkflow::all();

        return [
            'status' => ['required', 'string', Rule::in($allowedStatuses)],
        ];
    }
}
