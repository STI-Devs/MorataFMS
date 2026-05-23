<?php

namespace App\Data\LegacyBatches;

use App\Enums\ArchiveZipExportStatus;
use App\Enums\LegacyBatchModule;

final readonly class LegacyBatchZipExportIndexFilters
{
    public function __construct(
        public ?ArchiveZipExportStatus $status,
        public ?LegacyBatchModule $module,
        public int $perPage,
    ) {}
}
