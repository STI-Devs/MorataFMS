<?php

namespace App\Data\LegacyBatches;

final readonly class LegacyBatchManifestFileData
{
    public function __construct(
        public string $relativePath,
        public int $sizeBytes,
        public ?string $mimeType,
        public ?string $modifiedAt,
    ) {}

    public static function fromValidated(array $file): self
    {
        return new self(
            relativePath: (string) $file['relative_path'],
            sizeBytes: (int) $file['size_bytes'],
            mimeType: isset($file['mime_type']) ? (string) $file['mime_type'] : null,
            modifiedAt: isset($file['modified_at']) ? (string) $file['modified_at'] : null,
        );
    }
}
