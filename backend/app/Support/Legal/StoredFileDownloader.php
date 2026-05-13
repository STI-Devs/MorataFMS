<?php

namespace App\Support\Legal;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

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

        $mimeType = $disk->mimeType($path);
        $headers = [];

        if (is_string($mimeType) && $mimeType !== '') {
            $headers['Content-Type'] = $mimeType;
        }

        return response()->streamDownload(function () use ($stream): void {
            fpassthru($stream);

            if (is_resource($stream)) {
                fclose($stream);
            }
        }, $downloadName, $headers);
    }

    public function inline(
        string $diskName,
        ?string $path,
        string $missingPathMessage,
        string $missingStorageMessage,
        string $filename,
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

        return response()->stream(function () use ($stream): void {
            fpassthru($stream);

            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, [
            'Content-Type' => $this->resolveInlineMimeType($disk, $path, $filename),
            'Content-Disposition' => 'inline; filename="'.addslashes($filename).'"',
            'Cache-Control' => 'no-store',
            'X-Frame-Options' => 'SAMEORIGIN',
        ]);
    }

    public function disk(string $diskName): FilesystemAdapter
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk($diskName);

        return $disk;
    }

    private function resolveInlineMimeType(FilesystemAdapter $disk, string $path, string $filename): string
    {
        $extension = strtolower(pathinfo($filename !== '' ? $filename : $path, PATHINFO_EXTENSION));

        $mimeType = match ($extension) {
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            default => null,
        };

        if ($mimeType !== null) {
            return $mimeType;
        }

        try {
            return $disk->mimeType($path) ?: 'application/octet-stream';
        } catch (Throwable) {
            return 'application/octet-stream';
        }
    }
}
