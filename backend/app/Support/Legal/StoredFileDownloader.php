<?php

namespace App\Support\Legal;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;

class StoredFileDownloader
{
    public function download(
        string $diskName,
        ?string $path,
        string $missingPathMessage,
        string $missingStorageMessage,
        string $downloadName,
        string $readFailureMessage,
    ): StreamedResponse {
        if ($path === null || $path === '') {
            throw new HttpException(404, $missingPathMessage);
        }

        $disk = $this->disk($diskName);

        if (! $disk->exists($path)) {
            throw new HttpException(404, $missingStorageMessage);
        }

        $stream = $disk->readStream($path);

        if (! $stream) {
            throw new HttpException(500, $readFailureMessage);
        }

        return response()->streamDownload(function () use ($stream): void {
            fpassthru($stream);

            if (is_resource($stream)) {
                fclose($stream);
            }
        }, $downloadName);
    }

    public function disk(string $diskName): FilesystemAdapter
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk($diskName);

        return $disk;
    }
}
