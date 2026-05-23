<?php

namespace App\Http\Requests\Archives;

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
            'scope' => ['nullable', Rule::in(['folder'])],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'type' => ['required', Rule::in(['import', 'export'])],
            'mine' => ['nullable', 'boolean'],
        ];
    }

    public function archiveScope(): string
    {
        return (string) $this->input('scope', 'folder');
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
}
