<?php

namespace App\Http\Requests;

use App\Models\Document;
use App\Models\ExportTransaction;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreArchiveExportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by middleware; policy checked in controller
    }

    public function rules(): array
    {
        return [
            // Transaction fields
            'bl_no' => [
                'required',
                'string',
                'min:4',
                'max:50',
                'regex:/^[A-Za-z0-9\-]+$/',
                'unique:export_transactions,bl_no',
            ],
            'vessel' => ['nullable', 'string', 'max:100'],
            'shipper_id' => ['required', 'integer', 'exists:clients,id'],
            'destination_country_id' => ['required', 'integer', 'exists:countries,id'],

            // Archive-specific: must be past/present date, and not older than year 2000
            'file_date' => ['required', 'date', 'after_or_equal:2000-01-01', 'before_or_equal:today'],

            'notes' => ['nullable', 'string', 'max:1000'],

            // Documents array (optional)
            'documents' => ['nullable', 'array', 'list'],
            'documents.*.file' => [
                'required_with:documents',
                'file',
                'max:10240',
                'mimes:pdf,jpg,jpeg,png,docx,xlsx,csv',
            ],
            'documents.*.stage' => [
                'required_with:documents',
                'string',
                Rule::in(Document::exportTypeKeys()),
            ],
            'not_applicable_stages' => ['nullable', 'array', 'list'],
            'not_applicable_stages.*' => [
                'required_with:not_applicable_stages',
                'string',
                'distinct',
                Rule::in(ExportTransaction::optionalStageKeys()),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'bl_no.required' => 'Bill of Lading number is required.',
            'bl_no.min' => 'Bill of Lading number must be at least 4 characters.',
            'bl_no.regex' => 'Bill of Lading number may only contain letters, numbers, and hyphens.',
            'bl_no.unique' => 'This BL number already exists. Each shipment must have a unique BL number.',
            'shipper_id.required' => 'Please select a shipper.',
            'shipper_id.exists' => 'The selected shipper does not exist.',
            'destination_country_id.required' => 'Please select a destination country.',
            'destination_country_id.exists' => 'The selected destination country does not exist.',
            'file_date.required' => 'Archive period is required.',
            'file_date.date' => 'Archive period must be a valid date.',
            'file_date.after_or_equal' => 'Archive period cannot be before year 2000.',
            'file_date.before_or_equal' => 'Archive date cannot be in the future. Archives are for past documents only.',
            'documents.*.file.max' => 'Each file must be 10MB or less.',
            'documents.*.file.mimes' => 'Only PDF, JPG, PNG, DOCX, XLSX, and CSV files are accepted.',
            'not_applicable_stages.*.distinct' => 'Each optional stage can only be marked once.',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $documents = collect($this->input('documents', []));
                $stageLabels = Document::getTypeLabels();
                $notApplicableStages = collect($this->input('not_applicable_stages', []))
                    ->filter(fn ($stage) => is_string($stage))
                    ->values();
                $uploadedStages = $documents
                    ->pluck('stage')
                    ->filter(fn ($stage) => is_string($stage))
                    ->values();

                if ($this->user()?->role?->value === 'encoder') {
                    $processorOwnedOptionalStages = array_values(array_intersect(
                        ExportTransaction::processorOperationalDocumentTypes(),
                        ExportTransaction::optionalStageKeys(),
                    ));

                    $notApplicableStages
                        ->filter(fn (string $stage): bool => in_array($stage, $processorOwnedOptionalStages, true))
                        ->each(function (string $stage) use ($validator, $stageLabels): void {
                            $label = $stageLabels[$stage] ?? str($stage)->replace('_', ' ')->title()->value();

                            $validator->errors()->add(
                                'not_applicable_stages',
                                "Only processor users can mark the {$label} stage as not applicable during archive upload.",
                            );
                        });
                }

                if ($documents->isEmpty()) {
                    return;
                }

                foreach (['phytosanitary', 'co'] as $stage) {
                    if ($uploadedStages->contains($stage) || $notApplicableStages->contains($stage)) {
                        continue;
                    }

                    $label = $stageLabels[$stage] ?? str($stage)->replace('_', ' ')->title()->value();
                    $validator->errors()->add(
                        'documents',
                        "Upload files for the {$label} stage or mark it as not applicable before saving the archive.",
                    );
                }

                $notApplicableStages->each(function (string $stage) use ($validator, $stageLabels, $documents): void {
                    if (! $documents->contains('stage', $stage)) {
                        return;
                    }

                    $label = $stageLabels[$stage] ?? str($stage)->replace('_', ' ')->title()->value();
                    $validator->errors()->add(
                        'not_applicable_stages',
                        "You cannot upload files for the {$label} stage while it is marked as not applicable.",
                    );
                });

                $documents
                    ->countBy('stage')
                    ->each(function (int $count, string $stage) use ($validator, $stageLabels): void {
                        if ($count <= 10) {
                            return;
                        }

                        $label = $stageLabels[$stage] ?? str($stage)->replace('_', ' ')->title()->value();

                        $validator->errors()->add(
                            'documents',
                            "You can upload up to 10 files for the {$label} stage.",
                        );
                    });
            },
        ];
    }
}
