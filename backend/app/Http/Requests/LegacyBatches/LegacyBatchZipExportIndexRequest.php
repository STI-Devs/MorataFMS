<?php

namespace App\Http\Requests\LegacyBatches;

use App\Data\LegacyBatches\LegacyBatchZipExportIndexFilters;
use App\Enums\ArchiveZipExportStatus;
use App\Enums\LegacyBatchModule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LegacyBatchZipExportIndexRequest extends FormRequest
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
            'module' => ['nullable', Rule::in(array_map(
                fn (LegacyBatchModule $module): string => $module->value,
                LegacyBatchModule::cases(),
            ))],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    public function status(): ?ArchiveZipExportStatus
    {
        $status = $this->validated('status');

        return is_string($status) ? ArchiveZipExportStatus::from($status) : null;
    }

    public function module(): ?LegacyBatchModule
    {
        $module = $this->validated('module');

        return is_string($module) ? LegacyBatchModule::from($module) : null;
    }

    public function perPage(): int
    {
        return $this->integer('per_page', 20);
    }

    public function filters(): LegacyBatchZipExportIndexFilters
    {
        return new LegacyBatchZipExportIndexFilters(
            status: $this->status(),
            module: $this->module(),
            perPage: $this->perPage(),
        );
    }
}
