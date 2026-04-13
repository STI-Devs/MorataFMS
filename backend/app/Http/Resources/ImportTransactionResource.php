<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImportTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customs_ref_no' => $this->customs_ref_no,
            'bl_no' => $this->bl_no,
            'selective_color' => $this->selective_color,
            'importer' => [
                'id' => $this->importer?->id,
                'name' => $this->importer?->name,
            ],
            'origin_country' => $this->whenLoaded('originCountry', fn () => [
                'id' => $this->originCountry->id,
                'name' => $this->originCountry->name,
                'code' => $this->originCountry->code,
            ]),
            'arrival_date' => $this->arrival_date?->format('Y-m-d'),
            'assigned_user' => $this->whenLoaded('assignedUser', fn () => [
                'id' => $this->assignedUser->id,
                'name' => $this->assignedUser->name,
            ]),
            'status' => $this->status,
            'is_archive' => (bool) $this->is_archive,
            'archived_at' => $this->archived_at?->toISOString(),
            'archived_by_id' => $this->archived_by,
            'archive_origin' => $this->archive_origin?->value,
            'notes' => $this->notes,
            'stages' => $this->whenLoaded('stages', fn () => $this->progress),
            'not_applicable_stages' => $this->whenLoaded('stages', fn () => $this->notApplicableStageKeys()),
            'created_at' => $this->created_at?->toISOString(),
            'open_remarks_count' => $this->open_remarks_count ?? 0,
            'documents_count' => $this->documents_count ?? 0,
        ];
    }
}
