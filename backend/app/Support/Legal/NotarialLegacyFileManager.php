<?php

namespace App\Support\Legal;

use App\Models\NotarialBook;
use App\Models\NotarialLegacyFile;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialLegacyFileManager
{
    public function __construct(
        private StoredFileDownloader $storedFileDownloader,
    ) {}

    public function store(NotarialLegacyFile $legacyFile, NotarialBook $book, UploadedFile $file): void
    {
        $safeName = Str::of(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME))
            ->slug('_')
            ->value();
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $fileName = now()->format('YmdHis')."_{$safeName}_".Str::lower(Str::random(8)).".{$extension}";
        $directory = 'notarial-legacy-files/'.$book->year.'/book-'.str_pad((string) $book->book_number, 3, '0', STR_PAD_LEFT);

        $this->disk()->putFileAs($directory, $file, $fileName);

        $legacyFile->filename = $file->getClientOriginalName();
        $legacyFile->path = "{$directory}/{$fileName}";
        $legacyFile->disk = $this->storageDiskName();
        $legacyFile->mime_type = $file->getMimeType();
        $legacyFile->size_bytes = $file->getSize() ?: 0;
    }

    public function delete(NotarialLegacyFile $legacyFile): void
    {
        if (! $legacyFile->path) {
            return;
        }

        $disk = Storage::disk($legacyFile->disk ?: $this->storageDiskName());

        if ($disk->exists($legacyFile->path)) {
            $disk->delete($legacyFile->path);
        }
    }

    public function download(NotarialLegacyFile $legacyFile): StreamedResponse
    {
        return $this->storedFileDownloader->download(
            $legacyFile->disk ?: $this->storageDiskName(),
            $legacyFile->path,
            'Legacy scanned file not found on storage.',
            'Legacy scanned file not found on storage.',
            $legacyFile->filename,
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
