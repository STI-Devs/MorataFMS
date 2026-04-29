<?php

namespace App\Support\LegacyBatches;

use App\Enums\LegacyBatchFileStatus;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use Carbon\CarbonImmutable;

class LegacyBatchManifestRegistrar
{
    public function __construct(private LegacyBatchUploadUrlFactory $legacyBatchUploadUrlFactory) {}

    public function register(LegacyBatch $legacyBatch, array $files): void
    {
        if ($files === []) {
            return;
        }

        $timestamp = now();

        LegacyBatchFile::query()->upsert(
            collect($files)->map(function (array $file) use ($legacyBatch, $timestamp): array {
                $relativePath = $this->legacyBatchUploadUrlFactory->normalizeRelativePath($file['relative_path']);

                return [
                    'legacy_batch_id' => $legacyBatch->id,
                    'relative_path' => $relativePath,
                    'relative_path_hash' => hash('sha256', $relativePath),
                    'storage_path' => $this->legacyBatchUploadUrlFactory->pathFor($legacyBatch, $relativePath),
                    'filename' => str($relativePath)->afterLast('/')->value(),
                    'mime_type' => $file['mime_type'] ?? null,
                    'size_bytes' => (int) $file['size_bytes'],
                    'modified_at' => $this->normalizeModifiedAt($file['modified_at'] ?? null),
                    'status' => LegacyBatchFileStatus::Pending->value,
                    'uploaded_at' => null,
                    'failed_at' => null,
                    'failure_reason' => null,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
            })->all(),
            ['legacy_batch_id', 'relative_path_hash'],
            ['relative_path', 'storage_path', 'filename', 'mime_type', 'size_bytes', 'modified_at', 'updated_at'],
        );
    }

    private function normalizeModifiedAt(?string $modifiedAt): ?string
    {
        if ($modifiedAt === null || trim($modifiedAt) === '') {
            return null;
        }

        return CarbonImmutable::parse($modifiedAt)->format('Y-m-d H:i:s');
    }
}
