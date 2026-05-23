<?php

namespace App\Http\Requests\Archives;

use App\Data\Archives\ArchiveZipExportIndexFilters;
use App\Enums\ArchiveZipExportStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ArchiveZipExportIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::in(array_map(
                fn (ArchiveZipExportStatus $status): string => $status->value,
                ArchiveZipExportStatus::cases(),
            ))],
            'mine' => ['nullable', 'boolean'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function status(): ?ArchiveZipExportStatus
    {
        $status = $this->validated('status');

        return is_string($status) ? ArchiveZipExportStatus::from($status) : null;
    }

    public function perPage(): int
    {
        return $this->integer('per_page', 20);
    }

    public function mine(): ?bool
    {
        return $this->has('mine') ? $this->boolean('mine') : null;
    }

    public function filters(): ArchiveZipExportIndexFilters
    {
        return new ArchiveZipExportIndexFilters(
            status: $this->status(),
            mine: $this->mine(),
            perPage: $this->perPage(),
        );
    }
}
