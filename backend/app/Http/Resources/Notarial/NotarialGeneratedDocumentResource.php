<?php

namespace App\Http\Resources\Notarial;

use App\Support\Legal\LegalDocumentCatalog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotarialGeneratedDocumentResource extends JsonResource
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
            'party_name' => $this->party_name,
            'notes' => $this->notes,
            'generated_at' => $this->generated_at?->toISOString(),
            'generated_file' => [
                'filename' => $this->filename,
                'mime_type' => $this->mime_type,
                'size_bytes' => $this->size_bytes,
                'formatted_size' => $this->formatted_size,
                'download_url' => route('notarial.generated-documents.download', $this->resource),
                'preview_url' => route('notarial.generated-documents.preview', $this->resource),
            ],
            'template' => $this->whenLoaded('template', fn () => [
                'id' => $this->template->id,
                'code' => $this->template->code,
                'label' => $this->template->label,
            ]),
            'created_by' => $this->whenLoaded('createdBy', fn () => [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ]),
            'party' => $this->whenLoaded('legalParty', fn () => [
                'id' => $this->legalParty?->id,
                'name' => $this->legalParty?->name,
                'principal_address' => $this->legalParty?->principal_address,
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
