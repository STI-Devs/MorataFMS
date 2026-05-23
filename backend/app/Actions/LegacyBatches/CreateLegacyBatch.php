<?php

namespace App\Actions\LegacyBatches;

use App\Data\LegacyBatches\LegacyBatchCreateData;
use App\Enums\LegacyBatchStatus;
use App\Models\LegacyBatch;
use App\Models\User;
use App\Support\LegacyBatches\LegacyBatchManifestRegistrar;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateLegacyBatch
{
    public function __construct(private LegacyBatchManifestRegistrar $legacyBatchManifestRegistrar) {}

    public function handle(LegacyBatchCreateData $data, User $user): LegacyBatch
    {
        return DB::transaction(function () use ($data, $user): LegacyBatch {
            $batch = LegacyBatch::query()->create([
                'uuid' => (string) Str::uuid(),
                'batch_name' => $data->batchName,
                'root_folder' => $data->rootFolder,
                'year' => $data->yearTo,
                'year_from' => $data->yearFrom,
                'year_to' => $data->yearTo,
                'department' => $data->department,
                'module' => $data->module->value,
                'notes' => $data->notes,
                'status' => LegacyBatchStatus::Draft,
                'expected_file_count' => $data->expectedFileCount,
                'uploaded_file_count' => 0,
                'failed_file_count' => 0,
                'total_size_bytes' => $data->totalSizeBytes,
                'storage_disk' => (string) config('filesystems.default', 'local'),
                'uploaded_by' => $user->id,
                'last_activity_at' => now(),
            ]);

            $this->legacyBatchManifestRegistrar->register($batch, $data->manifest);

            return $batch;
        });
    }
}
