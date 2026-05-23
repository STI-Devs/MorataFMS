<?php

namespace App\Http\Requests\Archives;

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
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function year(): int
    {
        return $this->integer('year');
    }

    public function month(): int
    {
        return $this->integer('month');
    }

    public function archiveType(): string
    {
        return (string) $this->validated('type');
    }

    public function mine(): bool
    {
        return $this->boolean('mine');
    }

    public function search(): ?string
    {
        $search = trim((string) $this->input('search', ''));

        return $search !== '' ? $search : null;
    }

    public function completion(): string
    {
        $completion = (string) $this->input('completion', 'all');

        return $completion !== '' ? $completion : 'all';
    }

    public function perPage(): int
    {
        return $this->integer('per_page', 25);
    }
}
