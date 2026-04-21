<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class LegacyBatchDetailResource extends LegacyBatchResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = parent::toArray($request);

        $remainingRelativePaths = $this->relationLoaded('files')
            ? $this->files
                ->filter(fn ($file) => $file->status?->value !== 'uploaded')
                ->pluck('relative_path')
                ->values()
                ->all()
            : [];

        $data['tree'] = $this->tree ?? null;
        $data['remaining_relative_paths'] = $remainingRelativePaths;
        $data['started_at'] = $this->started_at?->toIso8601String();
        $data['completed_at'] = $this->completed_at?->toIso8601String();
        $data['last_activity_at'] = $this->last_activity_at?->toIso8601String();

        return $data;
    }
}
