<?php

namespace App\Support\LegacyBatches;

use App\Enums\LegacyBatchModule;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class LegacyBatchStoragePathMigrator
{
    public function __construct(private LegacyBatchUploadUrlFactory $legacyBatchUploadUrlFactory) {}

    /**
     * @return array{
     *     scanned_batch_count: int,
     *     scanned_file_count: int,
     *     pending_file_count: int,
     *     already_migrated_file_count: int,
     *     missing_file_count: int,
     *     copied_file_count: int,
     *     updated_file_count: int,
     *     deleted_legacy_object_count: int,
     *     updated_batch_count: int,
     *     failed_paths: list<string>,
     *     plans: list<array{file_id:int, batch_uuid:string, module:string, old_path:string, new_path:string, storage_disk:string, source_exists:bool, target_exists:bool}>
     * }
     */
    public function migrate(
        string $connectionName,
        ?LegacyBatchModule $module = null,
        ?string $batchUuid = null,
        bool $dryRun = true,
        ?string $storageDisk = null,
    ): array {
        $effectiveStorageDisk = $storageDisk ?: (string) config('filesystems.default', 'local');
        $batches = LegacyBatch::on($connectionName)
            ->with('files')
            ->when($module !== null, fn ($query) => $query->where('module', $module->value))
            ->when($batchUuid !== null, fn ($query) => $query->where('uuid', $batchUuid))
            ->orderBy('id')
            ->get();

        $plans = [];
        $scannedFileCount = 0;
        $alreadyMigratedFileCount = 0;

        foreach ($batches as $batch) {
            foreach ($batch->files as $file) {
                $scannedFileCount++;

                $plan = $this->planForFile($batch, $file, $effectiveStorageDisk);

                if ($plan === null) {
                    $alreadyMigratedFileCount++;

                    continue;
                }

                $plans[] = $plan;
            }
        }

        $result = [
            'scanned_batch_count' => $batches->count(),
            'scanned_file_count' => $scannedFileCount,
            'pending_file_count' => count($plans),
            'already_migrated_file_count' => $alreadyMigratedFileCount,
            'missing_file_count' => 0,
            'copied_file_count' => 0,
            'updated_file_count' => 0,
            'deleted_legacy_object_count' => 0,
            'updated_batch_count' => 0,
            'failed_paths' => [],
            'plans' => $plans,
        ];

        foreach ($plans as $index => $plan) {
            $storageDisk = Storage::disk($plan['storage_disk']);
            $plans[$index]['source_exists'] = $storageDisk->exists($plan['old_path']);
            $plans[$index]['target_exists'] = $storageDisk->exists($plan['new_path']);

            if (! $plans[$index]['source_exists'] && ! $plans[$index]['target_exists']) {
                $result['missing_file_count']++;
                $result['failed_paths'][] = $plan['old_path'];
            }
        }

        $result['plans'] = $plans;

        if ($dryRun || $result['missing_file_count'] > 0 || $plans === []) {
            return $result;
        }

        foreach ($plans as $plan) {
            $storageDisk = Storage::disk($plan['storage_disk']);

            if (! $plan['target_exists']) {
                try {
                    $storageDisk->copy($plan['old_path'], $plan['new_path']);
                    $result['copied_file_count']++;
                } catch (Throwable) {
                    $result['failed_paths'][] = $plan['old_path'];
                }
            }
        }

        if ($result['failed_paths'] !== []) {
            return $result;
        }

        DB::connection($connectionName)->transaction(function () use ($connectionName, $plans, &$result): void {
            foreach ($plans as $plan) {
                $result['updated_file_count'] += LegacyBatchFile::on($connectionName)
                    ->whereKey($plan['file_id'])
                    ->where('storage_path', $plan['old_path'])
                    ->update(['storage_path' => $plan['new_path']]);
            }

            $batchUpdates = collect($plans)
                ->map(fn (array $plan): array => [
                    'batch_uuid' => $plan['batch_uuid'],
                    'storage_disk' => $plan['storage_disk'],
                ])
                ->unique('batch_uuid');

            foreach ($batchUpdates as $batchUpdate) {
                $result['updated_batch_count'] += LegacyBatch::on($connectionName)
                    ->where('uuid', $batchUpdate['batch_uuid'])
                    ->where('storage_disk', '!=', $batchUpdate['storage_disk'])
                    ->update(['storage_disk' => $batchUpdate['storage_disk']]);
            }
        });

        foreach ($plans as $plan) {
            $storageDisk = Storage::disk($plan['storage_disk']);

            if ($storageDisk->exists($plan['old_path']) && $storageDisk->delete($plan['old_path'])) {
                $result['deleted_legacy_object_count']++;
            }
        }

        return $result;
    }

    /**
     * @return array{file_id:int, batch_uuid:string, module:string, old_path:string, new_path:string, storage_disk:string, source_exists:bool, target_exists:bool}|null
     */
    private function planForFile(LegacyBatch $batch, LegacyBatchFile $file, string $storageDisk): ?array
    {
        $legacyPrefix = $this->legacyBatchUploadUrlFactory->legacyPrefixFor($batch);
        $storagePath = (string) $file->storage_path;

        if ($storagePath !== $legacyPrefix && ! str_starts_with($storagePath, $legacyPrefix.'/')) {
            return null;
        }

        $relativePath = ltrim(substr($storagePath, strlen($legacyPrefix)), '/');
        $newPath = $this->legacyBatchUploadUrlFactory->prefixFor($batch).($relativePath !== '' ? '/'.$relativePath : '');
        $module = $batch->module instanceof LegacyBatchModule
            ? $batch->module->value
            : (LegacyBatchModule::tryFrom((string) $batch->module)?->value ?? LegacyBatchModule::Brokerage->value);

        return [
            'file_id' => (int) $file->id,
            'batch_uuid' => (string) $batch->uuid,
            'module' => $module,
            'old_path' => $storagePath,
            'new_path' => $newPath,
            'storage_disk' => $storageDisk,
            'source_exists' => false,
            'target_exists' => false,
        ];
    }
}
