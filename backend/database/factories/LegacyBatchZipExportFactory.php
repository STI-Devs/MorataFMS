<?php

namespace Database\Factories;

use App\Enums\ArchiveZipExportStatus;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchZipExport;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<LegacyBatchZipExport>
 */
class LegacyBatchZipExportFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'legacy_batch_id' => LegacyBatch::factory(),
            'requested_by' => User::factory(),
            'status' => ArchiveZipExportStatus::Pending,
            'storage_disk' => (string) config('filesystems.default', 'local'),
            'file_path' => null,
            'filename' => fake()->slug().'.zip',
            'file_size_bytes' => 0,
            'file_count' => 0,
            'error_message' => null,
            'started_at' => null,
            'completed_at' => null,
            'expires_at' => now()->addHours(LegacyBatchZipExport::EXPIRATION_HOURS),
        ];
    }

    public function ready(): self
    {
        return $this->state(fn () => [
            'status' => ArchiveZipExportStatus::Ready,
            'file_path' => 'legacy-batch-zip-exports/'.Str::uuid().'/batch.zip',
            'file_size_bytes' => 1024,
            'file_count' => 2,
            'completed_at' => now(),
            'expires_at' => now()->addHours(LegacyBatchZipExport::EXPIRATION_HOURS),
        ]);
    }

    public function failed(): self
    {
        return $this->state(fn () => [
            'status' => ArchiveZipExportStatus::Failed,
            'error_message' => 'ZIP preparation failed.',
            'completed_at' => now(),
        ]);
    }
}
