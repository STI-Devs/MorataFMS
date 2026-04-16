<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'max:20480',
                'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png',
            ],
            'type' => [
                'required',
                'string',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! is_string($value) || ! Document::isAllowedTypeFor($this->input('documentable_type'), $value)) {
                        $fail('Invalid document type selected.');
                    }
                },
            ],
            'documentable_type' => [
                'required',
                'string',
                Rule::in([ImportTransaction::class, ExportTransaction::class]),
            ],
            'documentable_id' => [
                'required',
                'integer',
                function ($attribute, $value, $fail) {
                    $type = $this->input('documentable_type');
                    if (! $type || ! class_exists($type)) {
                        $fail('Invalid documentable type.');

                        return;
                    }
                    if (! $type::where('id', $value)->exists()) {
                        $fail('The selected transaction does not exist.');
                    }
                },
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Please select a file to upload.',
            'file.uploaded' => 'The file could not be uploaded by the server. If the file is within the 20 MB app limit, increase the PHP upload limit and try again.',
            'file.file' => 'The file could not be uploaded by the server. If the file is within the 20 MB app limit, increase the PHP upload limit and try again.',
            'file.max' => 'The file must not be larger than 20 MB.',
            'file.mimes' => 'Only PDF, Office documents, and images are allowed.',
            'type.in' => 'Invalid document type selected.',
            'documentable_type.in' => 'Invalid transaction type.',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $documentableType = $this->input('documentable_type');
                $documentableId = $this->input('documentable_id');
                $stage = $this->input('type');

                if (! is_string($documentableType) || ! is_numeric($documentableId) || ! is_string($stage)) {
                    return;
                }

                $transaction = match ($documentableType) {
                    ImportTransaction::class => ImportTransaction::query()->with('stages')->find($documentableId),
                    ExportTransaction::class => ExportTransaction::query()->with('stages')->find($documentableId),
                    default => null,
                };

                if ($transaction && $transaction->isStageNotApplicable($stage)) {
                    $label = Document::getTypeLabels()[$stage] ?? str($stage)->replace('_', ' ')->title()->value();

                    $validator->errors()->add(
                        'type',
                        "The {$label} stage is marked as not applicable for this transaction.",
                    );
                }

                $user = $this->user();
                if (! $user) {
                    return;
                }

                $allowedTypes = match ($user->role) {
                    UserRole::Processor => match ($documentableType) {
                        ImportTransaction::class => ['ppa', 'port_charges'],
                        ExportTransaction::class => ['cil', 'dccci'],
                        default => [],
                    },
                    UserRole::Accounting => match ($documentableType) {
                        ImportTransaction::class, ExportTransaction::class => ['billing'],
                        default => [],
                    },
                    default => Document::allowedTypeKeysFor($documentableType),
                };

                if (! in_array($stage, $allowedTypes, true)) {
                    $validator->errors()->add(
                        'type',
                        'You are not allowed to upload this document type for the selected transaction.',
                    );

                    return;
                }

                if (
                    $transaction instanceof ImportTransaction
                    || $transaction instanceof ExportTransaction
                ) {
                    if ($stage === 'others') {
                        return;
                    }

                    if (! $transaction->isDocumentTypeReadyForUpload($stage)) {
                        $validator->errors()->add(
                            'type',
                            'This stage is not ready for upload yet.',
                        );
                    }
                }
            },
        ];
    }
}
