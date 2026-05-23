<?php

namespace App\Http\Requests\Archives;

use App\Data\Archives\ArchiveZipExportData;
use App\Enums\ArchiveZipExportScope;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreArchiveZipExportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'scope' => ['nullable', Rule::in(['folder', 'year'])],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => [Rule::requiredIf($this->archiveScope() === 'folder'), 'nullable', 'integer', 'min:1', 'max:12'],
            'type' => [Rule::requiredIf($this->archiveScope() === 'folder'), 'nullable', Rule::in(['import', 'export'])],
            'mine' => ['nullable', 'boolean'],
        ];
    }

    private function archiveScope(): string
    {
        return (string) $this->input('scope', 'folder');
    }

    public function zipExportData(): ArchiveZipExportData
    {
        $validated = $this->validated();
        $type = $validated['type'] ?? null;

        return new ArchiveZipExportData(
            scope: ArchiveZipExportScope::from((string) ($validated['scope'] ?? 'folder')),
            year: $this->integer('year'),
            month: $this->filled('month') ? $this->integer('month') : null,
            type: is_string($type) ? $type : null,
            mine: $this->boolean('mine'),
        );
    }
}
