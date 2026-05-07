<?php

namespace App\Http\Requests\Notarial;

use Illuminate\Foundation\Http\FormRequest;

class NotarialBookIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [];
    }

    public function yearValue(): ?string
    {
        return $this->filled('year') ? (string) $this->input('year') : null;
    }

    public function statusValue(): ?string
    {
        return $this->filled('status') ? (string) $this->input('status') : null;
    }

    public function perPage(): int
    {
        return $this->integer('per_page', 15);
    }
}
