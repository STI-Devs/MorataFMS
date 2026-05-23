<?php

namespace App\Data\Archives;

final readonly class ArchiveExportData
{
    public function __construct(
        public string $blNo,
        public ?string $vessel,
        public int $shipperId,
        public int $destinationCountryId,
        public string $fileDate,
        public ?string $notes,
        public ArchiveDocumentUploadsData $documents,
        public array $notApplicableStages,
    ) {}

    public static function fromValidated(array $validated): self
    {
        return new self(
            blNo: (string) $validated['bl_no'],
            vessel: isset($validated['vessel']) ? (string) $validated['vessel'] : null,
            shipperId: (int) $validated['shipper_id'],
            destinationCountryId: (int) $validated['destination_country_id'],
            fileDate: (string) $validated['file_date'],
            notes: isset($validated['notes']) ? (string) $validated['notes'] : null,
            documents: ArchiveDocumentUploadsData::fromValidatedDocuments($validated['documents'] ?? []),
            notApplicableStages: array_values(array_map(
                fn (mixed $stage): string => (string) $stage,
                $validated['not_applicable_stages'] ?? [],
            )),
        );
    }

    public function hasDocumentOrApplicabilityChanges(): bool
    {
        return ! $this->documents->isEmpty() || $this->notApplicableStages !== [];
    }
}
