<?php

namespace App\Data\Archives;

use Illuminate\Http\UploadedFile;

final readonly class ArchiveDocumentData
{
    public function __construct(
        public UploadedFile $file,
        public string $stage,
    ) {}

    public static function fromValidated(array $document): self
    {
        return new self(
            file: $document['file'],
            stage: (string) $document['stage'],
        );
    }
}
