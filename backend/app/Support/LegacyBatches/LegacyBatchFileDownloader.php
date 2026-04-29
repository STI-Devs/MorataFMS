<?php

namespace App\Support\LegacyBatches;

use App\Enums\LegacyBatchFileStatus;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LegacyBatchFileDownloader
{
    public function download(LegacyBatch $legacyBatch, LegacyBatchFile $legacyBatchFile): StreamedResponse
    {
        if ($legacyBatchFile->legacy_batch_id !== $legacyBatch->id) {
            abort(404, 'Legacy batch file not found.');
        }

        if ($legacyBatchFile->status !== LegacyBatchFileStatus::Uploaded) {
            abort(409, 'This file is not available for download yet.');
        }

        return Storage::disk($legacyBatch->storage_disk)->download(
            $legacyBatchFile->storage_path,
            $legacyBatchFile->filename,
        );
    }
}
