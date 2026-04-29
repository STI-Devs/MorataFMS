<?php

namespace App\Http\Requests;

use App\Models\NotarialPageScan;
use Illuminate\Foundation\Http\FormRequest;

class UpdateNotarialPageScanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'page_start' => ['required', 'integer', 'min:1', 'max:9999'],
            'page_end' => ['required', 'integer', 'min:1', 'max:9999', 'gte:page_start'],
            'file' => [
                'nullable',
                'file',
                'max:51200',
                'mimes:pdf,jpg,jpeg,png',
            ],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $scan = $this->route('scan');

            if (! $scan instanceof NotarialPageScan) {
                return;
            }

            $pageStart = (int) $this->input('page_start');
            $pageEnd = (int) $this->input('page_end');

            if ($pageStart <= 0 || $pageEnd <= 0) {
                return;
            }

            $conflict = NotarialPageScan::query()
                ->where('notarial_book_id', $scan->notarial_book_id)
                ->where('id', '!=', $scan->id)
                ->where('page_start', '<=', $pageEnd)
                ->where('page_end', '>=', $pageStart)
                ->first();

            if ($conflict) {
                $validator->errors()->add(
                    'page_start',
                    sprintf(
                        'Pages %d–%d are already covered by "%s" (%s). Edit or delete that scan first.',
                        $conflict->page_start,
                        $conflict->page_end,
                        $conflict->filename,
                        $conflict->page_range_label,
                    ),
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'file.max' => 'The scan must not be larger than 50 MB.',
            'file.mimes' => 'Only PDF and image files (jpg, jpeg, png) are allowed.',
            'page_end.gte' => 'The end page must be greater than or equal to the start page.',
        ];
    }
}
