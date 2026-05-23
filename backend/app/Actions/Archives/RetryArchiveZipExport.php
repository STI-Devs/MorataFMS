<?php

namespace App\Actions\Archives;

use App\Enums\ArchiveZipExportStatus;
use App\Jobs\GenerateArchiveZipExport;
use App\Models\ArchiveZipExport;
use Illuminate\Support\Facades\Storage;

class RetryArchiveZipExport
{
    public function handle(ArchiveZipExport $archiveZipExport): ArchiveZipExport
    {
        if ($archiveZipExport->status === ArchiveZipExportStatus::Processing) {
            abort(409, 'This archive ZIP is already being prepared.');
        }

        if ($archiveZipExport->status === ArchiveZipExportStatus::Pending) {
            return $archiveZipExport->loadMissing('requestedBy');
        }

        if ($archiveZipExport->file_path !== null) {
            Storage::disk($archiveZipExport->storage_disk)->delete($archiveZipExport->file_path);
        }

        $archiveZipExport->forceFill([
            'status' => ArchiveZipExportStatus::Pending,
            'file_size_bytes' => 0,
            'file_count' => 0,
            'bl_count' => 0,
            'error_message' => null,
            'started_at' => null,
            'completed_at' => null,
            'expires_at' => now()->addHours(ArchiveZipExport::EXPIRATION_HOURS),
        ])->save();

        GenerateArchiveZipExport::dispatch($archiveZipExport->id)->afterCommit();

        return $archiveZipExport->refresh()->loadMissing('requestedBy');
    }
}
