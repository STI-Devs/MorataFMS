<?php

namespace App\Http\Resources;

use App\Support\Legal\LegalDocumentCatalog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LegalArchiveRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'file_category' => $this->file_category,
            'file_category_label' => LegalDocumentCatalog::labelForLegalFileCategory($this->file_category),
            'file_code' => $this->file_code,
            'file_code_label' => LegalDocumentCatalog::labelForLegalFileCode($this->file_code),
            'title' => $this->title,
            'related_name' => $this->related_name,
            'document_date' => $this->document_date?->toDateString(),
            'notes' => $this->notes,
            'upload_status' => $this->path ? 'uploaded' : 'missing_upload',
            'file' => $this->path ? [
                'filename' => $this->filename,
                'mime_type' => $this->mime_type,
                'size_bytes' => $this->size_bytes,
                'formatted_size' => $this->formatted_size,
                'download_url' => route('legal-archive.download', $this->resource),
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
