<?php

namespace App\Http\Requests\Notarial;

use Illuminate\Foundation\Http\FormRequest;

class NotarialTemplateIndexRequest extends FormRequest
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

    public function documentCode(): ?string
    {
        return $this->filled('document_code') ? $this->string('document_code')->value() : null;
    }

    public function isActiveFilter(): ?bool
    {
        return $this->filled('is_active') ? $this->boolean('is_active') : null;
    }

    public function templateStatus(): ?string
    {
        return $this->filled('template_status') ? $this->string('template_status')->value() : null;
    }

    public function perPage(): int
    {
        return $this->integer('per_page', 25);
    }
}
