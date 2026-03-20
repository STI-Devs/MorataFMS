<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'name' => $this->name,
            'email' => $this->email,
            'job_title' => $this->job_title,
            'role' => $this->role?->value ?? $this->role,
            'role_label' => $this->role?->label() ?? (string) $this->role,
            'is_active' => (bool) $this->is_active,
            'departments' => $this->getDepartmentsArray(),
            'multi_department' => $this->isMultiDepartment(),
            'permissions' => $this->getPermissionMap(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
