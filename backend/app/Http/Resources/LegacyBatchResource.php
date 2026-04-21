<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LegacyBatchResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $pendingCount = max((int) $this->expected_file_count - (int) $this->uploaded_file_count, 0);
        $yearFrom = $this->effectiveYearFrom();
        $yearTo = $this->effectiveYearTo();

        return [
            'id' => $this->uuid,
            'batch_name' => $this->batch_name,
            'root_folder' => $this->root_folder,
            'upload_date' => $this->created_at?->toIso8601String(),
            'status' => $this->status?->value,
            'status_label' => $this->status?->label(),
            'file_count' => (int) $this->expected_file_count,
            'uploaded_file_count' => (int) $this->uploaded_file_count,
            'failed_file_count' => (int) $this->failed_file_count,
            'pending_file_count' => $pendingCount,
            'total_size_bytes' => (int) $this->total_size_bytes,
            'uploaded_by' => $this->whenLoaded('uploadedBy', fn () => [
                'id' => $this->uploadedBy->id,
                'name' => $this->uploadedBy->name,
            ]),
            'metadata' => [
                'year' => $this->coverageYearLabel(),
                'year_from' => $yearFrom,
                'year_to' => $yearTo,
                'department' => $this->department,
                'notes' => $this->notes,
                'preserve_names' => true,
                'legacy_reference_only' => true,
            ],
            'upload_summary' => [
                'expected' => (int) $this->expected_file_count,
                'uploaded' => (int) $this->uploaded_file_count,
                'failed' => (int) $this->failed_file_count,
                'remaining' => $pendingCount,
            ],
            'can_resume' => in_array($this->status?->value, ['draft', 'uploading', 'interrupted', 'failed'], true),
        ];
    }
}
