<?php

namespace App\Data\Archives;

final readonly class ArchiveFolderHistoryFilters
{
    public function __construct(
        public bool $mine,
        public int $year,
        public int $month,
        public string $type,
        public ?string $search,
        public string $completion,
        public string $sort,
        public string $direction,
        public int $perPage,
    ) {}
}
