<?php

namespace App\Support\Legal;

use App\Models\NotarialTemplate;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialTemplateFileManager
{
    public function __construct(
        private StoredFileDownloader $storedFileDownloader,
    ) {}

    public function store(NotarialTemplate $template, UploadedFile $file, string $documentCode): void
    {
        $this->delete($template);

        $safeName = Str::of(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME))
            ->slug('_')
            ->value();
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $fileName = now()->format('YmdHis')."_{$safeName}_".Str::lower(Str::random(8)).".{$extension}";
        $directory = 'notarial-templates/'.Str::slug($documentCode);

        $this->disk()->putFileAs($directory, $file, $fileName);

        $template->filename = $file->getClientOriginalName();
        $template->path = "{$directory}/{$fileName}";
        $template->disk = $this->storageDiskName();
        $template->mime_type = $file->getMimeType();
        $template->size_bytes = $file->getSize() ?: 0;
    }

    public function delete(NotarialTemplate $template): void
    {
        if (! $template->path) {
            return;
        }

        $disk = Storage::disk($template->disk ?: $this->storageDiskName());

        if ($disk->exists($template->path)) {
            $disk->delete($template->path);
        }
    }

    public function download(NotarialTemplate $template): StreamedResponse
    {
        return $this->storedFileDownloader->download(
            $template->disk ?: $this->storageDiskName(),
            $template->path,
            'No Word template file is attached to this template.',
            'Word template file not found on storage.',
            $template->filename ?? 'notarial-template.docx',
            'Unable to read the template file stream.',
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
