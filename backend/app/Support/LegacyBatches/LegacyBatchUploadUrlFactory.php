<?php

namespace App\Support\LegacyBatches;

use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use Illuminate\Support\Facades\Storage;

class LegacyBatchUploadUrlFactory
{
    private const STORAGE_ROOT = 'legacy-batches';

    private const SIGNED_UPLOAD_EXPIRY_MINUTES = 30;

    public function pathFor(LegacyBatch $batch, string $relativePath): string
    {
        return $this->prefixFor($batch).'/'.$this->normalizeRelativePath($relativePath);
    }

    public function prefixFor(LegacyBatch $batch): string
    {
        return sprintf('%s/%s', self::STORAGE_ROOT, $batch->uuid);
    }

    /**
     * @return array{url: string, headers: array<string, string>}
     */
    public function make(LegacyBatch $batch, LegacyBatchFile $file): array
    {
        return Storage::disk($batch->storage_disk)->temporaryUploadUrl(
            $file->storage_path,
            now()->addMinutes(self::SIGNED_UPLOAD_EXPIRY_MINUTES),
        );
    }

    public function normalizeRelativePath(string $relativePath): string
    {
        $normalized = str_replace('\\', '/', trim($relativePath));
        $normalized = preg_replace('#/+#', '/', $normalized) ?: '';

        return trim($normalized, '/');
    }
}
