<?php

namespace App\Actions\LegacyBatches;

use App\Enums\ArchiveZipExportStatus;
use App\Models\LegacyBatchZipExport;
use Illuminate\Support\Facades\Storage;

class DeleteLegacyBatchZipExport
{
    public function handle(LegacyBatchZipExport $legacyBatchZipExport): void
    {
        if ($legacyBatchZipExport->status === ArchiveZipExportStatus::Processing) {
            abort(409, 'This legacy batch ZIP is still being prepared.');
        }

        if ($legacyBatchZipExport->file_path !== null) {
            Storage::disk($legacyBatchZipExport->storage_disk)->delete($legacyBatchZipExport->file_path);
        }

        $legacyBatchZipExport->delete();
    }
}
