<?php

namespace App\Support\Documents;

use App\Models\Document;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class DocumentFileStreamer
{
    public function download(Document $document): StreamedResponse
    {
        $disk = $this->documentDisk();

        if (! $disk->exists($document->path)) {
            abort(404, 'File not found on storage.');
        }

        $stream = $disk->readStream($document->path);

        if (! $stream) {
            abort(500, 'Unable to read file stream.');
        }

        return response()->streamDownload(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, $document->filename);
    }

    public function inline(Document $document): StreamedResponse
    {
        $disk = $this->documentDisk();

        if (! $disk->exists($document->path)) {
            abort(404, 'File not found on storage.');
        }

        $mimeType = $this->resolveInlineMimeType($document, $disk);
        $stream = $disk->readStream($document->path);

        if (! $stream) {
            abort(500, 'Unable to read file stream.');
        }

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="'.addslashes($document->filename).'"',
            'Cache-Control' => 'no-store',
            'X-Frame-Options' => 'SAMEORIGIN',
        ]);
    }

    public function delete(Document $document): void
    {
        $this->documentDisk()->delete($document->path);
    }

    private function storageDisk(): string
    {
        return (string) config('filesystems.default', 'local');
    }

    private function documentDisk(): FilesystemAdapter
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk($this->storageDisk());

        return $disk;
    }

    private function resolveInlineMimeType(Document $document, FilesystemAdapter $disk): string
    {
        $mimeTypeFromFilename = $this->mimeTypeFromFilename($document);

        if ($mimeTypeFromFilename !== null) {
            return $mimeTypeFromFilename;
        }

        try {
            return $disk->mimeType($document->path) ?: 'application/octet-stream';
        } catch (Throwable) {
            return 'application/octet-stream';
        }
    }

    private function mimeTypeFromFilename(Document $document): ?string
    {
        $filename = $document->filename !== '' ? $document->filename : $document->path;
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        return match ($extension) {
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            default => null,
        };
    }
}
