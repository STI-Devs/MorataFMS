<?php

namespace App\Data\LegacyBatches;

use ArrayIterator;
use Countable;
use IteratorAggregate;
use Traversable;

final readonly class LegacyBatchManifestData implements Countable, IteratorAggregate
{
    private array $files;

    private function __construct(LegacyBatchManifestFileData ...$files)
    {
        $this->files = $files;
    }

    public static function fromValidatedFiles(array $files): self
    {
        return new self(...array_map(
            fn (array $file): LegacyBatchManifestFileData => LegacyBatchManifestFileData::fromValidated($file),
            $files,
        ));
    }

    public function isEmpty(): bool
    {
        return $this->files === [];
    }

    public function totalSizeBytes(): int
    {
        return array_sum(array_map(
            fn (LegacyBatchManifestFileData $file): int => $file->sizeBytes,
            $this->files,
        ));
    }

    public function count(): int
    {
        return count($this->files);
    }

    public function getIterator(): Traversable
    {
        return new ArrayIterator($this->files);
    }
}
