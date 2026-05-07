<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;

class ReportTurnaroundRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [];
    }

    public function yearValue(): int
    {
        return (int) $this->query('year', date('Y'));
    }

    public function monthValue(): ?int
    {
        return $this->query('month') !== null ? (int) $this->query('month') : null;
    }
}
