<?php

namespace App\Actions\LegacyBatches;

use App\Enums\LegacyBatchFileStatus;
use App\Models\LegacyBatch;
use App\Support\LegacyBatches\LegacyBatchUploadUrlFactory;
use Illuminate\Support\Facades\Storage;

class CompleteLegacyBatchUploads
{
    public function __construct(private LegacyBatchUploadUrlFactory $legacyBatchUploadUrlFactory) {}

    public function handle(LegacyBatch $legacyBatch, array $relativePaths): LegacyBatch
    {
        $normalizedRelativePaths = collect($relativePaths)
            ->map(fn (string $path): string => $this->legacyBatchUploadUrlFactory->normalizeRelativePath($path))
            ->values();

        $files = $legacyBatch->files()
            ->whereIn('relative_path', $normalizedRelativePaths)
            ->get();

        foreach ($files as $file) {
            $exists = Storage::disk($legacyBatch->storage_disk)->exists($file->storage_path);

            $file->forceFill([
                'status' => $exists ? LegacyBatchFileStatus::Uploaded : LegacyBatchFileStatus::Failed,
                'uploaded_at' => $exists ? now() : null,
                'failed_at' => $exists ? null : now(),
                'failure_reason' => $exists ? null : 'Uploaded object was not found on the configured storage disk.',
            ])->save();
        }

        return $legacyBatch->syncProgressCounts()->refresh()->load('uploadedBy');
    }
}
