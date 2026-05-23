<?php

namespace App\Data\LegalArchive;

final readonly class LegalArchiveRecordIndexFilters
{
    public function __construct(
        public ?string $search,
        public ?string $fileCategory,
        public ?string $fileCode,
        public ?string $uploadStatus,
        public int $perPage,
    ) {}
}
