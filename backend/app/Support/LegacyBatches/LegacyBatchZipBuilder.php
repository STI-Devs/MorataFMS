<?php

namespace App\Support\LegacyBatches;

use App\Enums\LegacyBatchFileStatus;
use App\Enums\LegacyBatchStatus;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use App\Models\LegacyBatchZipExport;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;
use ZipArchive;

class LegacyBatchZipBuilder
{
    private const ZIP_BATCH_SIZE = 200;

    private const FILE_CHUNK_SIZE = 200;

    public function downloadFilename(LegacyBatch $legacyBatch): string
    {
        $name = Str::of($legacyBatch->batch_name ?: $legacyBatch->root_folder)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9]+/', '-')
            ->trim('-')
            ->toString();

        return ($name !== '' ? $name : 'legacy-batch').'.zip';
    }

    /**
     * @return array{file_count:int, file_size_bytes:int}
     */
    public function store(LegacyBatchZipExport $legacyBatchZipExport): array
    {
        if (! class_exists(ZipArchive::class)) {
            throw new HttpException(500, 'ZIP support is not available on this server.');
        }

        $legacyBatch = $legacyBatchZipExport->legacyBatch;

        if (! $legacyBatch instanceof LegacyBatch) {
            throw new HttpException(404, 'Legacy batch was not found.');
        }

        if ($legacyBatch->status !== LegacyBatchStatus::Completed) {
            throw new HttpException(409, 'Only completed legacy batches can be prepared as ZIP downloads.');
        }

        $fileCount = $this->fileQuery($legacyBatch)->count();

        if ($fileCount === 0) {
            throw new HttpException(404, 'This legacy batch has no uploaded files to download.');
        }

        $zipPath = $this->temporaryZipPath();

        try {
            $this->buildZip($legacyBatch, $zipPath);
            $fileSizeBytes = (int) filesize($zipPath);
            $this->storeZipFile($legacyBatchZipExport, $zipPath);

            return [
                'file_count' => $fileCount,
                'file_size_bytes' => $fileSizeBytes,
            ];
        } finally {
            $this->deleteFiles([$zipPath]);
        }
    }

    private function buildZip(LegacyBatch $legacyBatch, string $zipPath): void
    {
        $workDir = dirname($zipPath);
        $zip = new ZipArchive;
        $disk = Storage::disk($legacyBatch->storage_disk);
        $tempFiles = [];
        $usedEntryNames = [];
        $zipOpen = false;
        $filesInBatch = 0;

        try {
            $this->openZip($zip, $zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
            $zipOpen = true;

            $this->fileQuery($legacyBatch)
                ->chunkById(self::FILE_CHUNK_SIZE, function ($files) use (
                    $disk,
                    &$filesInBatch,
                    &$tempFiles,
                    &$usedEntryNames,
                    &$zip,
                    &$zipOpen,
                    $workDir,
                    $zipPath,
                ): void {
                    foreach ($files as $file) {
                        if ($filesInBatch >= self::ZIP_BATCH_SIZE) {
                            $this->closeZip($zip);
                            $zipOpen = false;
                            $this->deleteFiles($tempFiles);
                            $tempFiles = [];
                            $this->openZip($zip, $zipPath, ZipArchive::CREATE);
                            $zipOpen = true;
                            $filesInBatch = 0;
                        }

                        $tempPath = $this->copyFileToTempFile($disk, $file, $workDir);
                        $tempFiles[] = $tempPath;

                        $entryName = $this->uniqueEntryName(
                            $this->entryName($file),
                            $usedEntryNames,
                        );

                        if (! $zip->addFile($tempPath, $entryName)) {
                            throw new HttpException(500, "Unable to add {$file->filename} to the legacy batch ZIP.");
                        }

                        $filesInBatch++;
                    }
                });

            $this->closeZip($zip);
            $zipOpen = false;
            $this->deleteFiles($tempFiles);
        } catch (Throwable $exception) {
            if ($zipOpen) {
                $zip->close();
            }

            $this->deleteFiles([...$tempFiles, $zipPath]);

            throw $exception;
        }
    }

    /**
     * @return Builder<LegacyBatchFile>
     */
    private function fileQuery(LegacyBatch $legacyBatch): Builder
    {
        return LegacyBatchFile::query()
            ->whereBelongsTo($legacyBatch, 'batch')
            ->where('status', LegacyBatchFileStatus::Uploaded->value)
            ->orderBy('id');
    }

    private function temporaryZipPath(): string
    {
        $workDir = storage_path('app/tmp/legacy-batch-downloads');
        File::ensureDirectoryExists($workDir);

        return $workDir.DIRECTORY_SEPARATOR.uniqid('legacy-batch-', true).'.zip';
    }

    private function storeZipFile(LegacyBatchZipExport $legacyBatchZipExport, string $zipPath): void
    {
        $targetStream = fopen($zipPath, 'rb');

        if (! is_resource($targetStream)) {
            throw new HttpException(500, 'Unable to read generated legacy batch ZIP.');
        }

        try {
            $stored = Storage::disk($legacyBatchZipExport->storage_disk)->put($legacyBatchZipExport->file_path, $targetStream);
        } finally {
            fclose($targetStream);
        }

        if (! $stored) {
            throw new HttpException(500, 'Unable to store legacy batch ZIP.');
        }
    }

    private function openZip(ZipArchive $zip, string $zipPath, int $flags): void
    {
        $result = $zip->open($zipPath, $flags);

        if ($result !== true) {
            throw new HttpException(500, 'Unable to create legacy batch ZIP.');
        }
    }

    private function closeZip(ZipArchive $zip): void
    {
        if (! $zip->close()) {
            throw new HttpException(500, 'Unable to finalize legacy batch ZIP.');
        }
    }

    private function copyFileToTempFile(FilesystemAdapter $disk, LegacyBatchFile $file, string $workDir): string
    {
        if (! $disk->exists($file->storage_path)) {
            throw new HttpException(404, "Stored file is missing for {$file->filename}.");
        }

        $sourceStream = $disk->readStream($file->storage_path);

        if (! is_resource($sourceStream)) {
            throw new HttpException(500, "Unable to read {$file->filename} from storage.");
        }

        $tempPath = tempnam($workDir, 'legacy-batch-file-');

        if ($tempPath === false) {
            fclose($sourceStream);

            throw new HttpException(500, 'Unable to prepare temporary legacy batch file.');
        }

        $targetStream = fopen($tempPath, 'wb');

        if (! is_resource($targetStream)) {
            fclose($sourceStream);
            @unlink($tempPath);

            throw new HttpException(500, 'Unable to write temporary legacy batch file.');
        }

        try {
            stream_copy_to_stream($sourceStream, $targetStream);
        } finally {
            fclose($sourceStream);
            fclose($targetStream);
        }

        return $tempPath;
    }

    private function entryName(LegacyBatchFile $file): string
    {
        $segments = collect(explode('/', str_replace('\\', '/', $file->relative_path)))
            ->map(fn (string $segment): string => $this->sanitizePathSegment($segment))
            ->filter(fn (string $segment): bool => $segment !== '')
            ->values();

        if ($segments->isEmpty()) {
            return $this->sanitizePathSegment($file->filename ?: 'legacy-file');
        }

        return $segments->implode('/');
    }

    /**
     * @param  array<string, true>  $usedEntryNames
     */
    private function uniqueEntryName(string $entryName, array &$usedEntryNames): string
    {
        if (! isset($usedEntryNames[$entryName])) {
            $usedEntryNames[$entryName] = true;

            return $entryName;
        }

        $directory = pathinfo($entryName, PATHINFO_DIRNAME);
        $basename = pathinfo($entryName, PATHINFO_FILENAME);
        $extension = pathinfo($entryName, PATHINFO_EXTENSION);
        $counter = 2;

        do {
            $candidate = $directory !== '.'
                ? "{$directory}/{$basename} ({$counter})"
                : "{$basename} ({$counter})";

            if ($extension !== '') {
                $candidate .= ".{$extension}";
            }

            $counter++;
        } while (isset($usedEntryNames[$candidate]));

        $usedEntryNames[$candidate] = true;

        return $candidate;
    }

    private function sanitizePathSegment(string $value): string
    {
        $sanitized = preg_replace('/[\\\\\/\x00-\x1F\x7F]+/', '-', $value) ?? '';
        $sanitized = preg_replace('/\s+/', ' ', trim($sanitized)) ?? '';

        return trim($sanitized, " .\t\n\r\0\x0B") ?: 'unknown';
    }

    /**
     * @param  list<string>  $paths
     */
    private function deleteFiles(array $paths): void
    {
        foreach ($paths as $path) {
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }
}
