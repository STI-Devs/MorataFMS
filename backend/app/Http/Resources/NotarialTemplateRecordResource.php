<?php

namespace App\Http\Resources;

use App\Support\Legal\LegalDocumentCatalog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotarialTemplateRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'template_code' => $this->template_code,
            'template_label' => $this->template_label,
            'document_code' => $this->document_code,
            'document_code_label' => LegalDocumentCatalog::labelForCode($this->document_code),
            'document_category' => $this->document_category,
            'document_category_label' => LegalDocumentCatalog::labelForCategory($this->document_category),
            'notarial_act_type' => $this->notarial_act_type,
            'notarial_act_type_label' => LegalDocumentCatalog::labelForNotarialActType($this->notarial_act_type),
            'party_name' => $this->party_name,
            'template_data' => $this->template_data,
            'notes' => $this->notes,
            'generated_at' => $this->generated_at?->toISOString(),
            'generated_file' => [
                'filename' => $this->filename,
                'mime_type' => $this->mime_type,
                'size_bytes' => $this->size_bytes,
                'formatted_size' => $this->formatted_size,
                'download_url' => route('notarial.template-records.download', $this->resource),
            ],
            'template' => $this->whenLoaded('template', fn () => [
                'id' => $this->template->id,
                'code' => $this->template->code,
                'label' => $this->template->label,
            ]),
            'book' => $this->whenLoaded('book', fn () => [
                'id' => $this->book?->id,
                'book_number' => $this->book?->book_number,
                'year' => $this->book?->year,
                'status' => $this->book?->status,
            ]),
            'created_by' => $this->whenLoaded('createdBy', fn () => [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
