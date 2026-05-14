<?php

namespace App\Http\Requests\LegalArchive;

use App\Models\LegalArchiveRecord;
use App\Support\LawFirmDocuments\LawFirmDocumentCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLegalArchiveRecordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file_category' => ['required', 'string', Rule::in(LegalArchiveRecord::categoryCodes())],
            'file_code' => [
                'required',
                'string',
                Rule::in(LegalArchiveRecord::fileCodes()),
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (! is_string($value)) {
                        return;
                    }

                    $expectedCategory = LawFirmDocumentCatalog::legalFileCategoryForCode($value);
                    if ($expectedCategory !== null && $expectedCategory !== $this->string('file_category')->value()) {
                        $fail('The selected legal file does not belong to the chosen archive category.');
                    }
                },
            ],
            'title' => ['required', 'string', 'max:255'],
            'related_name' => ['required', 'string', 'max:255'],
            'document_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'file' => ['nullable', 'file', 'max:20480', 'mimes:pdf,doc,docx,xls,xlsx,jpg,jpeg,png'],
        ];
    }
}
