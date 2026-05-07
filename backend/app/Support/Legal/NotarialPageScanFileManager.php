<?php

namespace App\Support\Legal;

use App\Models\NotarialBook;
use App\Models\NotarialPageScan;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialPageScanFileManager
{
    public function __construct(
        private StoredFileDownloader $storedFileDownloader,
    ) {}

    public function store(NotarialPageScan $scan, NotarialBook $book, UploadedFile $file): void
    {
        $safeName = Str::of(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME))
            ->slug('_')
            ->value();
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $bookNumber = str_pad((string) $book->book_number, 3, '0', STR_PAD_LEFT);
        $range = $scan->page_start.'-'.$scan->page_end;
        $fileName = now()->format('YmdHis')."_pages_{$range}_{$safeName}_".Str::lower(Str::random(8)).".{$extension}";
        $directory = "notarial-page-scans/{$book->year}/book-{$bookNumber}";

        $this->disk()->putFileAs($directory, $file, $fileName);

        $scan->filename = $file->getClientOriginalName();
        $scan->path = "{$directory}/{$fileName}";
        $scan->disk = $this->storageDiskName();
        $scan->mime_type = $file->getMimeType();
        $scan->size_bytes = $file->getSize() ?: 0;
    }

    public function delete(NotarialPageScan $scan): void
    {
        if (! $scan->path) {
            return;
        }

        $disk = Storage::disk($scan->disk ?: $this->storageDiskName());

        if ($disk->exists($scan->path)) {
            $disk->delete($scan->path);
        }
    }

    public function download(NotarialPageScan $scan): StreamedResponse
    {
        return $this->storedFileDownloader->download(
            $scan->disk ?: $this->storageDiskName(),
            $scan->path,
            'Scan file not found on storage.',
            'Scan file not found on storage.',
            $scan->filename,
            'Unable to read file stream.',
        );
    }

    private function storageDiskName(): string
    {
        return (string) config('filesystems.default', 'local');
    }

    private function disk(): FilesystemAdapter
    {
        return $this->storedFileDownloader->disk($this->storageDiskName());
    }
}
