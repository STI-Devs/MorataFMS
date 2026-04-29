<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotarialBookResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'book_number' => $this->book_number,
            'year' => $this->year,
            'status' => $this->status,
            'generated_record_count' => $this->whenCounted('templateRecords', (int) $this->template_records_count),
            'page_scan_count' => $this->whenCounted('pageScans', (int) $this->page_scans_count),
            'legacy_file_count' => $this->whenCounted('legacyFiles', (int) $this->legacy_files_count),
            'opened_at' => $this->opened_at,
            'closed_at' => $this->closed_at,
            'notes' => $this->notes,
            'scan_file' => $this->path ? [
                'filename' => $this->filename,
                'mime_type' => $this->mime_type,
                'size_bytes' => $this->size_bytes,
                'formatted_size' => $this->formatted_size,
                'download_url' => route('notarial.books.scan.download', $this->resource),
            ] : null,
            'created_by' => $this->whenLoaded('createdBy', fn () => [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
