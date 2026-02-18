<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            // Main schema fields
            'event' => $this->event,
            'auditable_type' => $this->model_name,
            'auditable_id' => $this->auditable_id,
            'old_values' => $this->old_values,
            'new_values' => $this->new_values,
            // Akoa frontend expected fields
            'action' => $this->event,
            'description' => $this->new_values['description'] ?? $this->event,
            'subject_type' => $this->auditable_type
                ? strtolower(str($this->auditable_type)->afterLast('\\')->before('Transaction')->value())
                : null,
            'subject_id' => $this->auditable_id,
            // Common fields
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email ?? null,
                    'role' => $this->user->role ?? null,
                ];
            }),
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => null, // AuditLog has no updated_at
        ];
    }
}
