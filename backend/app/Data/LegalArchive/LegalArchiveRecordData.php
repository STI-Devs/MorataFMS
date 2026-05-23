<?php

namespace App\Data\LegalArchive;

final readonly class LegalArchiveRecordData
{
    public function __construct(
        public string $fileCategory,
        public string $fileCode,
        public string $title,
        public string $relatedName,
        public ?string $documentDate,
        public ?string $notes,
    ) {}

    public static function fromValidated(array $validated): self
    {
        return new self(
            fileCategory: (string) $validated['file_category'],
            fileCode: (string) $validated['file_code'],
            title: (string) $validated['title'],
            relatedName: (string) $validated['related_name'],
            documentDate: isset($validated['document_date']) ? (string) $validated['document_date'] : null,
            notes: isset($validated['notes']) ? (string) $validated['notes'] : null,
        );
    }

    public function toAttributes(): array
    {
        return [
            'file_category' => $this->fileCategory,
            'file_code' => $this->fileCode,
            'title' => $this->title,
            'related_name' => $this->relatedName,
            'document_date' => $this->documentDate,
            'notes' => $this->notes,
        ];
    }
}
