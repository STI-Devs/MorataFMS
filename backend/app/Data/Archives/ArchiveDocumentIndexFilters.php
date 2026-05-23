<?php

namespace App\Data\Archives;

final readonly class ArchiveDocumentIndexFilters
{
    public function __construct(
        public bool $mine,
        public ?int $year,
        public string $type,
        public ?string $search,
        public string $completion,
        public int $perPage,
    ) {}
}
