<?php

namespace App\Http\Resources;

use App\Support\Legal\LegalDocumentCatalog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotarialTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'label' => $this->label,
            'document_code' => $this->document_code,
            'document_code_label' => LegalDocumentCatalog::labelForCode($this->document_code),
            'document_category' => $this->document_category,
            'document_category_label' => LegalDocumentCatalog::labelForCategory($this->document_category),
            'default_notarial_act_type' => $this->default_notarial_act_type,
            'default_notarial_act_type_label' => LegalDocumentCatalog::labelForNotarialActType($this->default_notarial_act_type),
            'description' => $this->description,
            'field_schema' => $this->field_schema,
            'is_active' => $this->is_active,
            'template_status' => $this->hasSourceFile() ? 'ready' : 'missing_file',
            'source_file' => $this->path ? [
                'filename' => $this->filename,
                'mime_type' => $this->mime_type,
                'size_bytes' => $this->size_bytes,
                'formatted_size' => $this->formatted_size,
                'download_url' => route('notarial.templates.download', $this->resource),
            ] : null,
            'created_by' => $this->whenLoaded('createdBy', fn () => [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
