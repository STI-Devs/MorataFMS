<?php

namespace App\Data\Archives;

use App\Enums\ArchiveZipExportStatus;

final readonly class ArchiveZipExportIndexFilters
{
    public function __construct(
        public ?ArchiveZipExportStatus $status,
        public ?bool $mine,
        public int $perPage,
    ) {}
}
