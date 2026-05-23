<?php

namespace App\Data\Archives;

use App\Enums\ArchiveZipExportScope;

final readonly class ArchiveZipExportData
{
    public function __construct(
        public ArchiveZipExportScope $scope,
        public int $year,
        public ?int $month,
        public ?string $type,
        public bool $mine,
    ) {}
}
