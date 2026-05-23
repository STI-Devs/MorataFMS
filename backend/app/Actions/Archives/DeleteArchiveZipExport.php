<?php

namespace App\Actions\Archives;

use App\Enums\ArchiveZipExportStatus;
use App\Models\ArchiveZipExport;
use Illuminate\Support\Facades\Storage;

class DeleteArchiveZipExport
{
    public function handle(ArchiveZipExport $archiveZipExport): void
    {
        if ($archiveZipExport->status === ArchiveZipExportStatus::Processing) {
            abort(409, 'This archive ZIP is still being prepared.');
        }

        if ($archiveZipExport->file_path !== null) {
            Storage::disk($archiveZipExport->storage_disk)->delete($archiveZipExport->file_path);
        }

        $archiveZipExport->delete();
    }
}
