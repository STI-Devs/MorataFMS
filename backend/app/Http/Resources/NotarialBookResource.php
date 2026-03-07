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
            'entries_count' => $this->entries_count,
            'capacity' => 525,
            'is_full' => $this->isFull(),
            'opened_at' => $this->opened_at,
            'closed_at' => $this->closed_at,
            'created_by' => $this->whenLoaded('createdBy', fn() => [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ]),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
