<?php

namespace App\Data\Archives;

use ArrayIterator;
use Countable;
use IteratorAggregate;
use Traversable;

final readonly class ArchiveDocumentUploadsData implements Countable, IteratorAggregate
{
    private array $documents;

    private function __construct(ArchiveDocumentData ...$documents)
    {
        $this->documents = $documents;
    }

    public static function fromValidatedDocuments(array $documents): self
    {
        return new self(...array_map(
            fn (array $document): ArchiveDocumentData => ArchiveDocumentData::fromValidated($document),
            $documents,
        ));
    }

    public function isEmpty(): bool
    {
        return $this->documents === [];
    }

    public function count(): int
    {
        return count($this->documents);
    }

    public function getIterator(): Traversable
    {
        return new ArrayIterator($this->documents);
    }
}
