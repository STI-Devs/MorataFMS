<?php

namespace App\Data\Archives;

use App\Enums\SelectiveColor;

final readonly class ArchiveImportData
{
    public function __construct(
        public ?string $customsRefNo,
        public string $blNo,
        public SelectiveColor $selectiveColor,
        public int $importerId,
        public ?string $vesselName,
        public ?int $originCountryId,
        public ?int $locationOfGoodsId,
        public string $fileDate,
        public ?string $notes,
        public ArchiveDocumentUploadsData $documents,
        public array $notApplicableStages,
    ) {}

    public static function fromValidated(array $validated): self
    {
        $selectiveColor = $validated['selective_color'] instanceof SelectiveColor
            ? $validated['selective_color']
            : SelectiveColor::from((string) $validated['selective_color']);

        return new self(
            customsRefNo: isset($validated['customs_ref_no']) ? (string) $validated['customs_ref_no'] : null,
            blNo: (string) $validated['bl_no'],
            selectiveColor: $selectiveColor,
            importerId: (int) $validated['importer_id'],
            vesselName: isset($validated['vessel_name']) ? (string) $validated['vessel_name'] : null,
            originCountryId: isset($validated['origin_country_id']) ? (int) $validated['origin_country_id'] : null,
            locationOfGoodsId: isset($validated['location_of_goods_id']) ? (int) $validated['location_of_goods_id'] : null,
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
