<?php

namespace App\Support\LegacyBatches;

use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use App\Support\Operations\Deletion\Shared\DeletesFilesForPaths;
use App\Support\Operations\Deletion\Shared\PurgesAuditLogsForSubjects;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class LegacyBatchDeletionExecutor
{
    public function __construct(
        private DeletesFilesForPaths $deletesFilesForPaths,
        private PurgesAuditLogsForSubjects $purgesAuditLogsForSubjects,
        private LegacyBatchUploadUrlFactory $legacyBatchUploadUrlFactory,
    ) {}

    /**
     * @return array{
     *     storage_disk: string,
     *     storage_prefix: string,
     *     database_file_count: int,
     *     storage_object_count: int,
     *     orphan_storage_object_count: int,
     *     missing_storage_object_count: int,
     *     database_paths: list<string>,
     *     storage_paths: list<string>,
     *     orphan_storage_paths: list<string>,
     *     missing_storage_paths: list<string>
     * }
     */
    public function inspect(LegacyBatch $legacyBatch): array
    {
        $storagePrefix = $this->legacyBatchUploadUrlFactory->prefixFor($legacyBatch);
        $databasePaths = $legacyBatch->files()
            ->orderBy('id')
            ->pluck('storage_path')
            ->filter(fn (?string $path): bool => filled($path))
            ->unique()
            ->values()
            ->all();

        $storagePaths = collect(Storage::disk($legacyBatch->storage_disk)->allFiles($storagePrefix))
            ->filter(fn (?string $path): bool => filled($path))
            ->unique()
            ->values()
            ->all();

        $orphanStoragePaths = array_values(array_diff($storagePaths, $databasePaths));
        $missingStoragePaths = array_values(array_diff($databasePaths, $storagePaths));

        return [
            'storage_disk' => $legacyBatch->storage_disk,
            'storage_prefix' => $storagePrefix,
            'database_file_count' => count($databasePaths),
            'storage_object_count' => count($storagePaths),
            'orphan_storage_object_count' => count($orphanStoragePaths),
            'missing_storage_object_count' => count($missingStoragePaths),
            'database_paths' => $databasePaths,
            'storage_paths' => $storagePaths,
            'orphan_storage_paths' => $orphanStoragePaths,
            'missing_storage_paths' => $missingStoragePaths,
        ];
    }

    /**
     * @return array{
     *     storage_disk: string,
     *     storage_prefix: string,
     *     database_file_count: int,
     *     storage_object_count: int,
     *     orphan_storage_object_count: int,
     *     missing_storage_object_count: int,
     *     database_paths: list<string>,
     *     storage_paths: list<string>,
     *     orphan_storage_paths: list<string>,
     *     missing_storage_paths: list<string>,
     *     deleted_storage_object_count: int,
     *     deleted_file_record_count: int,
     *     deleted_batch_count: int,
     *     audit_log_count: int,
     *     failed_file_deletions: list<string>
     * }
     */
    public function delete(LegacyBatch $legacyBatch): array
    {
        $inspection = $this->inspect($legacyBatch);

        $pathsToDelete = collect([
            ...$inspection['database_paths'],
            ...$inspection['orphan_storage_paths'],
        ])->unique()->values()->all();

        $deletedStorageObjectCount = 0;
        $failedFileDeletions = [];

        if ($pathsToDelete !== []) {
            $fileDeletion = $this->deletesFilesForPaths->delete($legacyBatch->storage_disk, $pathsToDelete);
            $deletedStorageObjectCount = $fileDeletion['deleted_file_count'];
            $failedFileDeletions = $fileDeletion['failed_file_deletions'];
        }

        $remainingStoragePaths = collect(Storage::disk($legacyBatch->storage_disk)->allFiles($inspection['storage_prefix']))
            ->filter(fn (?string $path): bool => filled($path))
            ->unique()
            ->values()
            ->all();

        if ($remainingStoragePaths !== []) {
            $failedFileDeletions = array_values(array_unique([
                ...$failedFileDeletions,
                ...$remainingStoragePaths,
            ]));
        }

        if ($failedFileDeletions !== []) {
            return [
                ...$inspection,
                'deleted_storage_object_count' => $deletedStorageObjectCount,
                'deleted_file_record_count' => 0,
                'deleted_batch_count' => 0,
                'audit_log_count' => 0,
                'failed_file_deletions' => $failedFileDeletions,
            ];
        }

        $fileIds = $legacyBatch->files()
            ->orderBy('id')
            ->pluck('id')
            ->map(fn (int|string $id): int => (int) $id)
            ->all();

        $deletedFileRecordCount = 0;
        $deletedBatchCount = 0;
        $deletedAuditLogCount = 0;
        $connectionName = $legacyBatch->getConnectionName() ?? config('database.default');

        DB::connection($connectionName)->transaction(function () use (
            $legacyBatch,
            $fileIds,
            &$deletedFileRecordCount,
            &$deletedBatchCount,
            &$deletedAuditLogCount,
            $connectionName,
        ): void {
            $deletedFileRecordCount = LegacyBatchFile::withoutAuditing(
                fn (): int => $legacyBatch->files()->delete()
            );
            $deletedBatchCount = LegacyBatch::withoutAuditing(
                fn (): int => $legacyBatch->delete() ? 1 : 0
            );
            $deletedAuditLogCount = $this->purgesAuditLogsForSubjects->delete([
                LegacyBatch::class => [$legacyBatch->id],
                LegacyBatchFile::class => $fileIds,
            ], $connectionName);
        });

        return [
            ...$inspection,
            'deleted_storage_object_count' => $deletedStorageObjectCount,
            'deleted_file_record_count' => $deletedFileRecordCount,
            'deleted_batch_count' => $deletedBatchCount,
            'audit_log_count' => $deletedAuditLogCount,
            'failed_file_deletions' => [],
        ];
    }
}
