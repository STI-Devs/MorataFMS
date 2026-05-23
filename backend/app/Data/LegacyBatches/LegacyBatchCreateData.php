<?php

namespace App\Data\LegacyBatches;

use App\Enums\LegacyBatchModule;

final readonly class LegacyBatchCreateData
{
    public function __construct(
        public string $batchName,
        public string $rootFolder,
        public int $yearFrom,
        public int $yearTo,
        public string $department,
        public LegacyBatchModule $module,
        public ?string $notes,
        public int $expectedFileCount,
        public int $totalSizeBytes,
        public LegacyBatchManifestData $manifest,
    ) {}

    public static function fromValidated(array $validated): self
    {
        $manifest = LegacyBatchManifestData::fromValidatedFiles($validated['files']);
        $moduleInput = $validated['module'] ?? LegacyBatchModule::Brokerage->value;
        $module = $moduleInput instanceof LegacyBatchModule
            ? $moduleInput
            : LegacyBatchModule::from((string) $moduleInput);

        return new self(
            batchName: (string) $validated['batch_name'],
            rootFolder: (string) $validated['root_folder'],
            yearFrom: (int) $validated['year_from'],
            yearTo: (int) $validated['year_to'],
            department: (string) $validated['department'],
            module: $module,
            notes: isset($validated['notes']) ? (string) $validated['notes'] : null,
            expectedFileCount: (int) ($validated['expected_file_count'] ?? count($manifest)),
            totalSizeBytes: (int) ($validated['total_size_bytes'] ?? $manifest->totalSizeBytes()),
            manifest: $manifest,
        );
    }
}
