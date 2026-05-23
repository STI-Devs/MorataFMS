<?php

namespace App\Http\Requests\Archives;

use App\Data\Archives\ArchiveDocumentIndexFilters;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ArchiveDocumentIndexRequest extends FormRequest
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
            'mine' => ['nullable', 'boolean'],
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'type' => ['nullable', Rule::in(['all', 'import', 'export'])],
            'search' => ['nullable', 'string', 'max:100'],
            'completion' => ['nullable', Rule::in(['all', 'complete', 'incomplete'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function filters(): ArchiveDocumentIndexFilters
    {
        $validated = $this->validated();
        $type = (string) ($validated['type'] ?? 'all');
        $search = trim((string) ($validated['search'] ?? ''));
        $completion = (string) ($validated['completion'] ?? 'all');

        return new ArchiveDocumentIndexFilters(
            mine: $this->boolean('mine'),
            year: $this->filled('year') ? $this->integer('year') : null,
            type: $type !== '' ? $type : 'all',
            search: $search !== '' ? $search : null,
            completion: $completion !== '' ? $completion : 'all',
            perPage: $this->integer('per_page', 25),
        );
    }
}
