<?php

namespace Database\Factories;

use App\Enums\LegacyBatchFileStatus;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LegacyBatchFile>
 */
class LegacyBatchFileFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $rootFolder = strtoupper(fake()->bothify('VESSEL ###'));
        $filename = fake()->lexify('legacy-file-????').'.pdf';
        $relativePath = $rootFolder.'/'.fake()->lexify('VOYAGE-????').'/'.$filename;

        return [
            'legacy_batch_id' => LegacyBatch::factory(),
            'relative_path' => $relativePath,
            'storage_path' => 'legacy-batches/'.fake()->uuid().'/'.$relativePath,
            'filename' => $filename,
            'mime_type' => 'application/pdf',
            'size_bytes' => fake()->numberBetween(1_024, 5_242_880),
            'modified_at' => now()->subDays(fake()->numberBetween(1, 30)),
            'status' => LegacyBatchFileStatus::Pending,
            'uploaded_at' => null,
            'failed_at' => null,
            'failure_reason' => null,
        ];
    }

    public function uploaded(): self
    {
        return $this->state(fn () => [
            'status' => LegacyBatchFileStatus::Uploaded,
            'uploaded_at' => now(),
            'failed_at' => null,
            'failure_reason' => null,
        ]);
    }
}
