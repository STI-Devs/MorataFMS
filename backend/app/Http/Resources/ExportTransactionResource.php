<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExportTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'bl_no' => $this->bl_no,
            'vessel' => $this->vessel,
            'shipper' => [
                'id' => $this->shipper?->id,
                'name' => $this->shipper?->name,
            ],
            'destination_country' => $this->whenLoaded('destinationCountry', fn() => [
                'id' => $this->destinationCountry->id,
                'name' => $this->destinationCountry->name,
                'code' => $this->destinationCountry->code,
            ]),
            'assigned_user' => $this->whenLoaded('assignedUser', fn() => [
                'id' => $this->assignedUser->id,
                'name' => $this->assignedUser->name,
            ]),
            'status' => $this->status,
            'notes' => $this->notes,
            'stages' => $this->whenLoaded('stages', fn() => [
                'docs_prep' => $this->stages->docs_prep_status,
                'co' => $this->stages->co_status,
                'cil' => $this->stages->cil_status,
                'bl' => $this->stages->bl_status,
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'open_remarks_count' => $this->open_remarks_count ?? 0,
        ];
    }
}
