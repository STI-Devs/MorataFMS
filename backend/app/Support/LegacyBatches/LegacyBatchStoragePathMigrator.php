<?php

namespace App\Support\LegacyBatches;

use App\Enums\LegacyBatchModule;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class LegacyBatchStoragePathMigrator
{
    private const BATCH_CHUNK_SIZE = 10;

    private const PLAN_SAMPLE_LIMIT = 50;

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
        $query = LegacyBatch::on($connectionName)
            ->when($module !== null, fn ($query) => $query->where('module', $module->value))
            ->when($batchUuid !== null, fn ($query) => $query->where('uuid', $batchUuid));

        $result = [
            'scanned_batch_count' => (clone $query)->count(),
            'scanned_file_count' => 0,
            'pending_file_count' => 0,
            'already_migrated_file_count' => 0,
            'missing_file_count' => 0,
            'copied_file_count' => 0,
            'updated_file_count' => 0,
            'deleted_legacy_object_count' => 0,
            'updated_batch_count' => 0,
            'failed_paths' => [],
            'plans' => [],
        ];

        (clone $query)
            ->orderBy('id')
            ->chunkById(self::BATCH_CHUNK_SIZE, function (Collection $batches) use ($connectionName, $effectiveStorageDisk, $dryRun, &$result): void {
                $batches->load('files');

                foreach ($batches as $batch) {
                    $batchPlans = $this->plansForBatch($batch, $effectiveStorageDisk, $result);
                    $this->inspectPlans($batch, $batchPlans, $result);

                    if (! $dryRun && $result['missing_file_count'] === 0 && $batchPlans !== []) {
                        $this->applyPlans($connectionName, $batchPlans, $result);
                    }
                }
            });

        return $result;
    }

    /**
     * @param  array<string, mixed>  $result
     * @return list<array{file_id:int, batch_uuid:string, module:string, old_path:string, new_path:string, storage_disk:string, source_exists:bool, target_exists:bool}>
     */
    private function plansForBatch(LegacyBatch $batch, string $storageDisk, array &$result): array
    {
        $plans = [];

        foreach ($batch->files as $file) {
            $result['scanned_file_count']++;

            $plan = $this->planForFile($batch, $file, $storageDisk);

            if ($plan === null) {
                $result['already_migrated_file_count']++;

                continue;
            }

            $result['pending_file_count']++;
            $plans[] = $plan;
        }

        return $plans;
    }

    /**
     * @param  list<array{file_id:int, batch_uuid:string, module:string, old_path:string, new_path:string, storage_disk:string, source_exists:bool, target_exists:bool}>  $plans
     * @param  array<string, mixed>  $result
     */
    private function inspectPlans(LegacyBatch $batch, array &$plans, array &$result): void
    {
        if ($plans === []) {
            return;
        }

        $storageDisk = Storage::disk($plans[0]['storage_disk']);
        $legacyPaths = array_flip($storageDisk->allFiles($this->legacyBatchUploadUrlFactory->legacyPrefixFor($batch)));
        $modulePaths = array_flip($storageDisk->allFiles($this->legacyBatchUploadUrlFactory->prefixFor($batch)));

        foreach ($plans as $index => $plan) {
            $plans[$index]['source_exists'] = isset($legacyPaths[$plan['old_path']]);
            $plans[$index]['target_exists'] = isset($modulePaths[$plan['new_path']]);

            if (! $plans[$index]['source_exists'] && ! $plans[$index]['target_exists']) {
                $result['missing_file_count']++;
                $result['failed_paths'][] = $plan['old_path'];
            }

            $this->rememberPlanForSummary($plans[$index], $result);
        }
    }

    /**
     * @param  array{file_id:int, batch_uuid:string, module:string, old_path:string, new_path:string, storage_disk:string, source_exists:bool, target_exists:bool}  $plan
     * @param  array<string, mixed>  $result
     */
    private function rememberPlanForSummary(array $plan, array &$result): void
    {
        if (count($result['plans']) >= self::PLAN_SAMPLE_LIMIT) {
            return;
        }

        $result['plans'][] = $plan;
    }

    /**
     * @param  list<array{file_id:int, batch_uuid:string, module:string, old_path:string, new_path:string, storage_disk:string, source_exists:bool, target_exists:bool}>  $plans
     * @param  array<string, mixed>  $result
     */
    private function applyPlans(string $connectionName, array $plans, array &$result): void
    {
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
            return;
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
