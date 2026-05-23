<?php

namespace App\Http\Resources\LegacyBatches;

use App\Models\LegacyBatchZipExport;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin LegacyBatchZipExport */
class LegacyBatchZipExportResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'legacy_batch_id' => $this->relationLoaded('legacyBatch') ? $this->legacyBatch?->uuid : null,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'filename' => $this->filename,
            'file_size_bytes' => $this->file_size_bytes,
            'file_count' => $this->file_count,
            'error_message' => $this->error_message,
            'requested_at' => $this->created_at?->toIso8601String(),
            'started_at' => $this->started_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'can_download' => $this->isDownloadable(),
            'legacy_batch' => $this->whenLoaded('legacyBatch', fn (): ?array => $this->legacyBatch
                ? [
                    'id' => $this->legacyBatch->uuid,
                    'batch_name' => $this->legacyBatch->batch_name,
                    'root_folder' => $this->legacyBatch->root_folder,
                    'module' => $this->legacyBatch->module?->value,
                    'module_label' => $this->legacyBatch->module?->label(),
                ]
                : null),
            'requested_by' => $this->whenLoaded('requestedBy', fn (): ?array => $this->requestedBy
                ? [
                    'id' => $this->requestedBy->id,
                    'name' => $this->requestedBy->name,
                ]
                : null),
        ];
    }
}
