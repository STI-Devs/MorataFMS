<?php

namespace App\Support\LegacyBatches;

use App\Models\LegacyBatchZipExport;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

class LegacyBatchZipExportDownloader
{
    public function download(LegacyBatchZipExport $legacyBatchZipExport): StreamedResponse
    {
        if (! $legacyBatchZipExport->isDownloadable()) {
            throw new HttpException(409, 'This legacy batch ZIP is not ready for download.');
        }

        $disk = Storage::disk($legacyBatchZipExport->storage_disk);

        if (! $disk->exists($legacyBatchZipExport->file_path)) {
            throw new HttpException(404, 'Prepared legacy batch ZIP file was not found.');
        }

        $stream = $disk->readStream($legacyBatchZipExport->file_path);

        if (! is_resource($stream)) {
            throw new HttpException(500, 'Unable to read prepared legacy batch ZIP.');
        }

        $headers = [
            'Content-Type' => 'application/zip',
            'Cache-Control' => 'no-store',
        ];

        if ($legacyBatchZipExport->file_size_bytes > 0) {
            $headers['Content-Length'] = (string) $legacyBatchZipExport->file_size_bytes;
        }

        return response()->streamDownload(function () use ($stream): void {
            try {
                fpassthru($stream);
            } finally {
                fclose($stream);
            }
        }, $legacyBatchZipExport->filename, $headers);
    }
}
