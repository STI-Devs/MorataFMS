<?php

namespace App\Http\Resources;

use App\Enums\CountryType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CountryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $type = $this->type instanceof CountryType ? $this->type : CountryType::tryFrom((string) $this->type);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'type' => $type?->value ?? $this->type,
            'type_label' => $type?->label(),
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
