<?php

namespace App\Http\Resources\Archives;

use App\Models\ArchiveZipExport;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ArchiveZipExport */
class ArchiveZipExportResource extends JsonResource
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
            'scope' => $this->scope->value,
            'scope_label' => $this->scope->label(),
            'year' => $this->year,
            'month' => $this->month,
            'type' => $this->type,
            'mine' => $this->mine,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'filename' => $this->filename,
            'file_size_bytes' => $this->file_size_bytes,
            'file_count' => $this->file_count,
            'bl_count' => $this->bl_count,
            'error_message' => $this->error_message,
            'requested_at' => $this->created_at?->toIso8601String(),
            'started_at' => $this->started_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'can_download' => $this->isDownloadable(),
            'requested_by' => $this->whenLoaded('requestedBy', fn (): ?array => $this->requestedBy
                ? [
                    'id' => $this->requestedBy->id,
                    'name' => $this->requestedBy->name,
                ]
                : null),
        ];
    }
}
