<?php

namespace App\Actions\LegacyBatches;

use App\Enums\ArchiveZipExportStatus;
use App\Jobs\GenerateLegacyBatchZipExport;
use App\Models\LegacyBatchZipExport;
use Illuminate\Support\Facades\Storage;

class RetryLegacyBatchZipExport
{
    public function handle(LegacyBatchZipExport $legacyBatchZipExport): LegacyBatchZipExport
    {
        if ($legacyBatchZipExport->status === ArchiveZipExportStatus::Processing) {
            abort(409, 'This legacy batch ZIP is already being prepared.');
        }

        if ($legacyBatchZipExport->status === ArchiveZipExportStatus::Pending) {
            return $legacyBatchZipExport->loadMissing(['legacyBatch', 'requestedBy']);
        }

        if ($legacyBatchZipExport->file_path !== null) {
            Storage::disk($legacyBatchZipExport->storage_disk)->delete($legacyBatchZipExport->file_path);
        }

        $filePath = $legacyBatchZipExport->file_path
            ?: "legacy-batch-zip-exports/{$legacyBatchZipExport->uuid}/{$legacyBatchZipExport->filename}";

        $legacyBatchZipExport->forceFill([
            'status' => ArchiveZipExportStatus::Pending,
            'file_path' => $filePath,
            'file_size_bytes' => 0,
            'file_count' => 0,
            'error_message' => null,
            'started_at' => null,
            'completed_at' => null,
            'expires_at' => now()->addHours(LegacyBatchZipExport::EXPIRATION_HOURS),
        ])->save();

        GenerateLegacyBatchZipExport::dispatch($legacyBatchZipExport->id)->afterCommit();

        return $legacyBatchZipExport->refresh()->loadMissing(['legacyBatch', 'requestedBy']);
    }
}
