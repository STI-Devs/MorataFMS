<?php

namespace App\Http\Requests\Notarial;

use Illuminate\Foundation\Http\FormRequest;

class NotarialGeneratedDocumentIndexRequest extends FormRequest
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

    public function documentCategory(): ?string
    {
        return $this->filled('document_category') ? $this->string('document_category')->value() : null;
    }

    public function templateId(): ?int
    {
        return $this->filled('notarial_template_id') ? $this->integer('notarial_template_id') : null;
    }

    public function perPage(): int
    {
        return $this->integer('per_page', 25);
    }
}
