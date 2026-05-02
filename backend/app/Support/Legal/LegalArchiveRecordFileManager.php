<?php

namespace App\Support\Legal;

use App\Models\LegalArchiveRecord;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LegalArchiveRecordFileManager
{
    public function __construct(
        private StoredFileDownloader $storedFileDownloader,
    ) {}

    public function store(LegalArchiveRecord $record, UploadedFile $file, string $fileCategory): void
    {
        $safeName = Str::of(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME))
            ->slug('_')
            ->value();
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $fileName = now()->format('YmdHis')."_{$safeName}_".Str::lower(Str::random(8)).".{$extension}";
        $directory = 'legal-archive/'.now()->format('Y').'/'.Str::slug($fileCategory);

        $this->disk()->putFileAs($directory, $file, $fileName);

        $record->filename = $file->getClientOriginalName();
        $record->path = "{$directory}/{$fileName}";
        $record->disk = $this->storageDiskName();
        $record->mime_type = $file->getMimeType();
        $record->size_bytes = $file->getSize() ?: 0;
    }

    public function download(LegalArchiveRecord $record): StreamedResponse
    {
        return $this->storedFileDownloader->download(
            $record->disk ?: $this->storageDiskName(),
            $record->path,
            'File not found for this legal archive record.',
            'File not found on storage.',
            $record->filename ?? 'legal-file',
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
