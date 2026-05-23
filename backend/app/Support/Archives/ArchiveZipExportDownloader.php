<?php

namespace App\Support\Archives;

use App\Models\ArchiveZipExport;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ArchiveZipExportDownloader
{
    public function download(ArchiveZipExport $archiveZipExport): StreamedResponse
    {
        if (! $archiveZipExport->isDownloadable()) {
            throw new HttpException(409, 'This archive ZIP is not ready for download.');
        }

        $disk = Storage::disk($archiveZipExport->storage_disk);

        if (! $disk->exists($archiveZipExport->file_path)) {
            throw new HttpException(404, 'Prepared archive ZIP file was not found.');
        }

        $stream = $disk->readStream($archiveZipExport->file_path);

        if (! is_resource($stream)) {
            throw new HttpException(500, 'Unable to read prepared archive ZIP.');
        }

        $headers = [
            'Content-Type' => 'application/zip',
            'Cache-Control' => 'no-store',
        ];

        if ($archiveZipExport->file_size_bytes > 0) {
            $headers['Content-Length'] = (string) $archiveZipExport->file_size_bytes;
        }

        return response()->streamDownload(function () use ($stream): void {
            try {
                fpassthru($stream);
            } finally {
                fclose($stream);
            }
        }, $archiveZipExport->filename, $headers);
    }
}
