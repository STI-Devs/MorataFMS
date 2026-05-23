<?php

namespace App\Support\Archives;

use App\Models\ArchiveZipExport;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;
use ZipArchive;

class ArchiveFolderZipBuilder
{
    private const ZIP_BATCH_SIZE = 200;

    private const TRANSACTION_CHUNK_SIZE = 100;

    /**
     * @return array{file_count:int, bl_count:int, file_size_bytes:int}
     */
    public function store(ArchiveZipExport $archiveZipExport): array
    {
        if (! class_exists(ZipArchive::class)) {
            throw new HttpException(500, 'ZIP support is not available on this server.');
        }

        $user = $archiveZipExport->requestedBy;

        if (! $user instanceof User) {
            throw new HttpException(404, 'Archive ZIP request owner was not found.');
        }

        if ($archiveZipExport->month === null || $archiveZipExport->type === null) {
            throw new HttpException(422, 'Archive ZIP request is missing folder scope details.');
        }

        $query = $this->transactions(
            $user,
            $archiveZipExport->mine,
            $archiveZipExport->year,
            $archiveZipExport->month,
            $archiveZipExport->type,
        );
        $statistics = $this->statistics(clone $query);

        if ($statistics['file_count'] === 0) {
            throw new HttpException(404, 'This archive folder has no downloadable documents.');
        }

        $zipPath = $this->temporaryZipPath();

        try {
            $this->buildZip(clone $query, $archiveZipExport->type, $zipPath);
            $statistics['file_size_bytes'] = (int) filesize($zipPath);
            $this->storeZipFile($archiveZipExport, $zipPath);

            return $statistics;
        } finally {
            $this->deleteFiles([$zipPath]);
        }
    }

    public function downloadFilename(int $year, int $month, string $type): string
    {
        $monthName = strtolower(date('M', mktime(0, 0, 0, $month, 1)));
        $pluralType = $type === 'import' ? 'imports' : 'exports';

        return "{$monthName}-{$year}-{$pluralType}.zip";
    }

    /**
     * @return Builder<ImportTransaction|ExportTransaction>
     */
    public function transactions(
        User $user,
        bool $mine,
        int $year,
        int $month,
        string $type,
    ): Builder {
        $modelClass = $this->modelClass($type);
        $dateColumn = $this->dateColumn($type);

        $query = $modelClass::query()
            ->where('is_archive', true)
            ->with([
                'documents' => fn ($documentQuery) => $documentQuery
                    ->orderBy('type')
                    ->orderBy('filename'),
            ])
            ->where(function (Builder $dateQuery) use ($dateColumn, $year, $month): void {
                $dateQuery
                    ->where(function (Builder $primaryDateQuery) use ($dateColumn, $year, $month): void {
                        $primaryDateQuery
                            ->whereNotNull($dateColumn)
                            ->whereYear($dateColumn, $year)
                            ->whereMonth($dateColumn, $month);
                    })
                    ->orWhere(function (Builder $fallbackDateQuery) use ($dateColumn, $year, $month): void {
                        $fallbackDateQuery
                            ->whereNull($dateColumn)
                            ->whereYear('created_at', $year)
                            ->whereMonth('created_at', $month);
                    });
            });

        if ($mine) {
            $query->where('assigned_user_id', $user->id);
        }

        return $query;
    }

    /**
     * @param  Builder<ImportTransaction|ExportTransaction>  $query
     */
    private function buildZip(Builder $query, string $type, string $zipPath): void
    {
        $workDir = dirname($zipPath);
        $zip = new ZipArchive;
        $disk = $this->documentDisk();
        $tempFiles = [];
        $usedEntryNames = [];
        $zipOpen = false;
        $filesInBatch = 0;

        try {
            $this->openZip($zip, $zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
            $zipOpen = true;

            $query
                ->orderBy('id')
                ->chunkById(self::TRANSACTION_CHUNK_SIZE, function ($transactions) use (
                    $disk,
                    &$filesInBatch,
                    &$tempFiles,
                    &$usedEntryNames,
                    &$zip,
                    &$zipOpen,
                    $type,
                    $workDir,
                    $zipPath,
                ): void {
                    foreach ($transactions as $transaction) {
                        foreach ($transaction->documents as $document) {
                            if ($filesInBatch >= self::ZIP_BATCH_SIZE) {
                                $this->closeZip($zip);
                                $zipOpen = false;
                                $this->deleteFiles($tempFiles);
                                $tempFiles = [];
                                $this->openZip($zip, $zipPath, ZipArchive::CREATE);
                                $zipOpen = true;
                                $filesInBatch = 0;
                            }

                            $tempPath = $this->copyDocumentToTempFile($disk, $document, $workDir);
                            $tempFiles[] = $tempPath;

                            $entryName = $this->uniqueEntryName(
                                $this->entryName($transaction, $document, $type),
                                $usedEntryNames,
                            );

                            if (! $zip->addFile($tempPath, $entryName)) {
                                throw new HttpException(500, "Unable to add {$document->filename} to the archive ZIP.");
                            }

                            $filesInBatch++;
                        }
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
     * @param  Builder<ImportTransaction|ExportTransaction>  $query
     * @return array{file_count:int, bl_count:int, file_size_bytes:int}
     */
    private function statistics(Builder $query): array
    {
        return [
            'file_count' => (int) (clone $query)
                ->withCount('documents')
                ->pluck('documents_count')
                ->sum(),
            'bl_count' => (int) (clone $query)->count(),
            'file_size_bytes' => 0,
        ];
    }

    private function temporaryZipPath(): string
    {
        $workDir = storage_path('app/tmp/archive-downloads');
        File::ensureDirectoryExists($workDir);

        return $workDir.DIRECTORY_SEPARATOR.uniqid('archive-folder-', true).'.zip';
    }

    private function storeZipFile(ArchiveZipExport $archiveZipExport, string $zipPath): void
    {
        $targetStream = fopen($zipPath, 'rb');

        if (! is_resource($targetStream)) {
            throw new HttpException(500, 'Unable to read generated archive ZIP.');
        }

        try {
            $stored = Storage::disk($archiveZipExport->storage_disk)->put($archiveZipExport->file_path, $targetStream);
        } finally {
            fclose($targetStream);
        }

        if (! $stored) {
            throw new HttpException(500, 'Unable to store archive ZIP.');
        }
    }

    private function openZip(ZipArchive $zip, string $zipPath, int $flags): void
    {
        $result = $zip->open($zipPath, $flags);

        if ($result !== true) {
            throw new HttpException(500, 'Unable to create archive ZIP.');
        }
    }

    private function closeZip(ZipArchive $zip): void
    {
        if (! $zip->close()) {
            throw new HttpException(500, 'Unable to finalize archive ZIP.');
        }
    }

    private function copyDocumentToTempFile(FilesystemAdapter $disk, Document $document, string $workDir): string
    {
        if (! $disk->exists($document->path)) {
            throw new HttpException(404, "Stored file is missing for {$document->filename}.");
        }

        $sourceStream = $disk->readStream($document->path);

        if (! is_resource($sourceStream)) {
            throw new HttpException(500, "Unable to read {$document->filename} from storage.");
        }

        $tempPath = tempnam($workDir, 'archive-file-');

        if ($tempPath === false) {
            if (is_resource($sourceStream)) {
                fclose($sourceStream);
            }

            throw new HttpException(500, 'Unable to prepare temporary archive file.');
        }

        $targetStream = fopen($tempPath, 'wb');

        if (! is_resource($targetStream)) {
            fclose($sourceStream);
            @unlink($tempPath);

            throw new HttpException(500, 'Unable to write temporary archive file.');
        }

        try {
            stream_copy_to_stream($sourceStream, $targetStream);
        } finally {
            fclose($sourceStream);
            fclose($targetStream);
        }

        return $tempPath;
    }

    private function entryName(
        ImportTransaction|ExportTransaction $transaction,
        Document $document,
        string $type,
    ): string {
        $blNo = $this->sanitizePathSegment($transaction->bl_no ?: 'no-bl');
        $stage = $this->sanitizePathSegment($document->type ?: 'documents');
        $filename = $this->sanitizeFilename($document->filename ?: basename($document->path));

        return "{$blNo}/{$stage}/{$filename}";
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

    private function sanitizeFilename(string $value): string
    {
        $sanitized = $this->sanitizePathSegment($value);

        return $sanitized !== 'unknown' ? $sanitized : 'document';
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

    private function dateColumn(string $type): string
    {
        return $type === 'import' ? 'arrival_date' : 'export_date';
    }

    /**
     * @return class-string<ImportTransaction|ExportTransaction>
     */
    private function modelClass(string $type): string
    {
        return $type === 'import' ? ImportTransaction::class : ExportTransaction::class;
    }

    private function documentDisk(): FilesystemAdapter
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk((string) config('filesystems.default', 'local'));

        return $disk;
    }
}
