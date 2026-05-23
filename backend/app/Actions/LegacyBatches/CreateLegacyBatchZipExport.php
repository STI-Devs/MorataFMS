<?php

namespace App\Actions\LegacyBatches;

use App\Enums\ArchiveZipExportStatus;
use App\Enums\LegacyBatchStatus;
use App\Jobs\GenerateLegacyBatchZipExport;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchZipExport;
use App\Models\User;
use App\Support\LegacyBatches\LegacyBatchZipBuilder;
use Illuminate\Support\Str;

class CreateLegacyBatchZipExport
{
    public function __construct(
        private LegacyBatchZipBuilder $legacyBatchZipBuilder,
    ) {}

    public function handle(LegacyBatch $legacyBatch, User $user): LegacyBatchZipExport
    {
        if ($legacyBatch->status !== LegacyBatchStatus::Completed) {
            abort(409, 'Only completed legacy batches can be prepared as ZIP downloads.');
        }

        $existingRequest = LegacyBatchZipExport::query()
            ->whereBelongsTo($legacyBatch)
            ->whereIn('status', [
                ArchiveZipExportStatus::Pending->value,
                ArchiveZipExportStatus::Processing->value,
                ArchiveZipExportStatus::Ready->value,
            ])
            ->where(function ($query): void {
                $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->latest()
            ->first();

        if ($existingRequest instanceof LegacyBatchZipExport) {
            return $existingRequest->loadMissing(['legacyBatch', 'requestedBy']);
        }

        $uuid = (string) Str::uuid();
        $filename = $this->legacyBatchZipBuilder->downloadFilename($legacyBatch);

        $legacyBatchZipExport = LegacyBatchZipExport::create([
            'uuid' => $uuid,
            'legacy_batch_id' => $legacyBatch->id,
            'requested_by' => $user->id,
            'status' => ArchiveZipExportStatus::Pending,
            'storage_disk' => (string) config('filesystems.default', 'local'),
            'file_path' => "legacy-batch-zip-exports/{$uuid}/{$filename}",
            'filename' => $filename,
            'expires_at' => now()->addHours(LegacyBatchZipExport::EXPIRATION_HOURS),
        ]);

        GenerateLegacyBatchZipExport::dispatch($legacyBatchZipExport->id)->afterCommit();

        return $legacyBatchZipExport->loadMissing(['legacyBatch', 'requestedBy']);
    }
}
