<?php

namespace App\Actions\LegacyBatches;

use App\Enums\LegacyBatchStatus;
use App\Models\LegacyBatch;
use App\Models\User;
use App\Support\LegacyBatches\LegacyBatchManifestRegistrar;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateLegacyBatch
{
    public function __construct(private LegacyBatchManifestRegistrar $legacyBatchManifestRegistrar) {}

    public function handle(array $data, User $user): LegacyBatch
    {
        $manifestFiles = collect($data['files']);
        $expectedFileCount = (int) ($data['expected_file_count'] ?? $manifestFiles->count());
        $totalSizeBytes = (int) ($data['total_size_bytes'] ?? $manifestFiles->sum('size_bytes'));

        return DB::transaction(function () use ($data, $manifestFiles, $user, $expectedFileCount, $totalSizeBytes): LegacyBatch {
            $batch = LegacyBatch::query()->create([
                'uuid' => (string) Str::uuid(),
                'batch_name' => $data['batch_name'],
                'root_folder' => $data['root_folder'],
                'year' => (int) $data['year_to'],
                'year_from' => (int) $data['year_from'],
                'year_to' => (int) $data['year_to'],
                'department' => $data['department'],
                'notes' => $data['notes'] ?? null,
                'status' => LegacyBatchStatus::Draft,
                'expected_file_count' => $expectedFileCount,
                'uploaded_file_count' => 0,
                'failed_file_count' => 0,
                'total_size_bytes' => $totalSizeBytes,
                'storage_disk' => (string) config('filesystems.default', 'local'),
                'uploaded_by' => $user->id,
                'last_activity_at' => now(),
            ]);

            $this->legacyBatchManifestRegistrar->register($batch, $manifestFiles->all());

            return $batch;
        });
    }
}
