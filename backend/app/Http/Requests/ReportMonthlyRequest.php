<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReportMonthlyRequest extends FormRequest
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
}
