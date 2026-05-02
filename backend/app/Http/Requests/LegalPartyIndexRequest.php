<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LegalPartyIndexRequest extends FormRequest
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
        $search = trim((string) $this->query('search', ''));

        return $search !== '' ? $search : null;
    }

    public function limitValue(): int
    {
        return min(max($this->integer('limit', 8), 1), 20);
    }
}
