<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ClientIndexRequest extends FormRequest
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

    public function typeFilter(): ?string
    {
        $type = trim((string) $this->query('type', ''));

        return $type !== '' ? $type : null;
    }
}
