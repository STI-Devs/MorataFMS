<?php

namespace App\Http\Requests\Archives;

use App\Data\Archives\ArchiveFolderHistoryFilters;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ArchiveFolderHistoryRequest extends FormRequest
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
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'type' => ['required', Rule::in(['import', 'export'])],
            'mine' => ['nullable', 'boolean'],
            'search' => ['nullable', 'string', 'max:100'],
            'completion' => ['nullable', Rule::in(['all', 'complete', 'incomplete'])],
            'sort' => ['nullable', Rule::in(['period', 'bl', 'client', 'files'])],
            'direction' => ['nullable', Rule::in(['asc', 'desc'])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function filters(): ArchiveFolderHistoryFilters
    {
        $validated = $this->validated();
        $search = trim((string) ($validated['search'] ?? ''));
        $completion = (string) ($validated['completion'] ?? 'all');
        $sort = (string) ($validated['sort'] ?? 'period');
        $direction = (string) ($validated['direction'] ?? 'desc');

        return new ArchiveFolderHistoryFilters(
            mine: $this->boolean('mine'),
            year: $this->integer('year'),
            month: $this->integer('month'),
            type: (string) $validated['type'],
            search: $search !== '' ? $search : null,
            completion: $completion !== '' ? $completion : 'all',
            sort: $sort !== '' ? $sort : 'period',
            direction: $direction !== '' ? $direction : 'desc',
            perPage: $this->integer('per_page', 25),
        );
    }
}
