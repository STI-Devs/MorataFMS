<?php

namespace App\Support\Operations\Deletion;

class DeleteOperationResult
{
    /**
     * @param  array<string, int|string|bool|list<string>>  $summary
     */
    public function __construct(
        public readonly string $target,
        public readonly array $summary,
    ) {}
}
