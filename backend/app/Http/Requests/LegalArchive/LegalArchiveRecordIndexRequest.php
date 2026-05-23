<?php

namespace App\Http\Requests\LegalArchive;

use App\Data\LegalArchive\LegalArchiveRecordIndexFilters;
use Illuminate\Foundation\Http\FormRequest;

class LegalArchiveRecordIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [];
    }

    public function search(): ?string
    {
        $search = trim((string) $this->input('search', ''));

        return $search !== '' ? $search : null;
    }

    public function fileCategory(): ?string
    {
        return $this->filled('file_category') ? $this->string('file_category')->value() : null;
    }

    public function fileCode(): ?string
    {
        return $this->filled('file_code') ? $this->string('file_code')->value() : null;
    }

    public function uploadStatus(): ?string
    {
        return $this->filled('upload_status') ? $this->string('upload_status')->value() : null;
    }

    public function perPage(): int
    {
        return $this->integer('per_page', 25);
    }

    public function filters(): LegalArchiveRecordIndexFilters
    {
        return new LegalArchiveRecordIndexFilters(
            search: $this->search(),
            fileCategory: $this->fileCategory(),
            fileCode: $this->fileCode(),
            uploadStatus: $this->uploadStatus(),
            perPage: $this->perPage(),
        );
    }
}
