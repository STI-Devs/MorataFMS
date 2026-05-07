<?php

namespace App\Support\Legal;

use App\Models\NotarialBook;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialBookFileManager
{
    public function __construct(
        private StoredFileDownloader $storedFileDownloader,
    ) {}

    public function store(NotarialBook $book, UploadedFile $file, int $year, int|string $bookNumber): void
    {
        $this->delete($book);

        $safeName = Str::of(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME))
            ->slug('_')
            ->value();
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $fileName = now()->format('YmdHis')."_{$safeName}_".Str::lower(Str::random(8)).".{$extension}";
        $directory = 'notarial-books/'.$year.'/book-'.$bookNumber;

        $this->disk()->putFileAs($directory, $file, $fileName);

        $book->filename = $file->getClientOriginalName();
        $book->path = "{$directory}/{$fileName}";
        $book->disk = $this->storageDiskName();
        $book->mime_type = $file->getMimeType();
        $book->size_bytes = $file->getSize() ?: 0;
    }

    public function delete(NotarialBook $book): void
    {
        if (! $book->path) {
            return;
        }

        $disk = Storage::disk($book->disk ?: $this->storageDiskName());

        if ($disk->exists($book->path)) {
            $disk->delete($book->path);
        }
    }

    public function download(NotarialBook $book): StreamedResponse
    {
        return $this->storedFileDownloader->download(
            $book->disk ?: $this->storageDiskName(),
            $book->path,
            'No scanned file is attached to this notarial book.',
            'Scanned file not found on storage.',
            $book->filename ?? 'notarial-book-scan',
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
