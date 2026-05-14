<?php

namespace App\Http\Resources\LawFirmDocuments;

use App\Support\LawFirmDocuments\LawFirmDocumentCatalog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LawFirmDocumentTemplateResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'module' => $this->module,
            'code' => $this->code,
            'label' => $this->label,
            'document_code' => $this->document_code,
            'document_code_label' => LawFirmDocumentCatalog::labelForCodeInModule($this->document_code, $this->module),
            'document_category' => $this->document_category,
            'document_category_label' => LawFirmDocumentCatalog::labelForCategoryInModule($this->document_category, $this->module),
            'description' => $this->description,
            'is_active' => $this->is_active,
            'template_status' => $this->hasSourceFile() ? 'ready' : 'missing_file',
            'source_file' => $this->path ? [
                'filename' => $this->filename,
                'mime_type' => $this->mime_type,
                'size_bytes' => $this->size_bytes,
                'formatted_size' => $this->formatted_size,
                'download_url' => route(
                    $this->module === 'legal' ? 'legal.templates.download' : 'notarial.templates.download',
                    $this->resource,
                ),
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
