<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreVesselBillingDocumentsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->role === UserRole::Accounting;
    }

    public function rules(): array
    {
        return [
            'files' => [
                'required',
                'array',
                'min:1',
                'max:10',
            ],
            'files.*' => [
                'required',
                'file',
                'max:20480',
                'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png',
            ],
            'documentable_type' => [
                'required',
                'string',
                Rule::in([ImportTransaction::class, ExportTransaction::class]),
            ],
            'documentable_id' => [
                'required',
                'integer',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $type = $this->input('documentable_type');

                    if (! is_string($type) || ! class_exists($type)) {
                        $fail('Invalid transaction type.');

                        return;
                    }

                    if (! $type::query()->whereKey($value)->exists()) {
                        $fail('The selected transaction does not exist.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'files.required' => 'Please select at least one file to upload.',
            'files.array' => 'The upload payload must contain a file list.',
            'files.min' => 'Please select at least one file to upload.',
            'files.max' => 'You can upload up to 10 files at a time.',
            'files.*.uploaded' => 'The file could not be uploaded by the server. If the file is within the 20 MB app limit, increase the PHP upload limit and try again.',
            'files.*.file' => 'The file could not be uploaded by the server. If the file is within the 20 MB app limit, increase the PHP upload limit and try again.',
            'files.*.max' => 'Each file must be 20 MB or less.',
            'files.*.mimes' => 'Only PDF, Office documents, and images are allowed.',
            'documentable_type.in' => 'Invalid transaction type.',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $documentableType = $this->input('documentable_type');
                $documentableId = $this->input('documentable_id');

                if (! is_string($documentableType) || ! is_numeric($documentableId)) {
                    return;
                }

                $transaction = match ($documentableType) {
                    ImportTransaction::class => ImportTransaction::query()->with('stages')->find($documentableId),
                    ExportTransaction::class => ExportTransaction::query()->with('stages')->find($documentableId),
                    default => null,
                };

                if (! $transaction instanceof ImportTransaction && ! $transaction instanceof ExportTransaction) {
                    return;
                }

                if (! $transaction->isRelevantToOperationalQueue($this->user())) {
                    $validator->errors()->add(
                        'documentable_id',
                        'The selected transaction is not ready for accounting upload.',
                    );

                    return;
                }

                $vesselName = $transaction instanceof ImportTransaction
                    ? $transaction->vessel_name
                    : $transaction->vessel;

                if (! is_string($vesselName) || trim($vesselName) === '') {
                    $validator->errors()->add(
                        'documentable_id',
                        'The selected transaction does not have a vessel name for vessel-wide upload.',
                    );
                }
            },
        ];
    }
}
