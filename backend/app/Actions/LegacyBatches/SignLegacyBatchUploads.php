<?php

namespace App\Actions\LegacyBatches;

use App\Enums\LegacyBatchFileStatus;
use App\Enums\LegacyBatchStatus;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use App\Support\LegacyBatches\LegacyBatchUploadUrlFactory;
use Illuminate\Support\Collection;

class SignLegacyBatchUploads
{
    public function __construct(private LegacyBatchUploadUrlFactory $legacyBatchUploadUrlFactory) {}

    public function handle(LegacyBatch $legacyBatch, array $relativePaths): Collection
    {
        if ($legacyBatch->files()->count() !== $legacyBatch->expected_file_count) {
            abort(409, 'The legacy batch manifest is incomplete. Finish registering the selected files before uploads begin.');
        }

        $normalizedRelativePaths = collect($relativePaths)
            ->map(fn (string $path): string => $this->legacyBatchUploadUrlFactory->normalizeRelativePath($path))
            ->values();

        $files = $legacyBatch->files()
            ->whereIn('relative_path', $normalizedRelativePaths)
            ->where('status', '!=', LegacyBatchFileStatus::Uploaded->value)
            ->orderBy('relative_path')
            ->get();

        $legacyBatch->forceFill([
            'status' => LegacyBatchStatus::Uploading,
            'started_at' => $legacyBatch->started_at ?? now(),
            'last_activity_at' => now(),
        ])->save();

        return $files->map(function (LegacyBatchFile $file) use ($legacyBatch): array {
            $temporaryUpload = $this->legacyBatchUploadUrlFactory->make($legacyBatch, $file);

            return [
                'relative_path' => $file->relative_path,
                'upload_url' => $temporaryUpload['url'],
                'headers' => $temporaryUpload['headers'],
                'method' => 'PUT',
            ];
        })->values();
    }
}
