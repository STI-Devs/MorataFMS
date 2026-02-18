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
            'origin_country' => $this->whenLoaded('originCountry', fn() => [
                'id' => $this->originCountry->id,
                'name' => $this->originCountry->name,
                'code' => $this->originCountry->code,
            ]),
            'arrival_date' => $this->arrival_date?->format('Y-m-d'),
            'assigned_user' => $this->whenLoaded('assignedUser', fn() => [
                'id' => $this->assignedUser->id,
                'name' => $this->assignedUser->name,
            ]),
            'status' => $this->status,
            'notes' => $this->notes,
            'stages' => $this->whenLoaded('stages', fn() => [
                'boc' => $this->stages->boc_status,
                'ppa' => $this->stages->ppa_status,
                'do' => $this->stages->do_status,
                'port_charges' => $this->stages->port_charges_status,
                'releasing' => $this->stages->releasing_status,
                'billing' => $this->stages->billing_status,
            ]),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
