<?php

namespace Database\Factories;

use App\Enums\LegacyBatchStatus;
use App\Models\LegacyBatch;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<LegacyBatch>
 */
class LegacyBatchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $yearFrom = fake()->numberBetween(2021, now()->year);
        $yearTo = fake()->numberBetween($yearFrom, now()->year);

        return [
            'uuid' => (string) Str::uuid(),
            'batch_name' => fake()->words(3, true),
            'root_folder' => strtoupper(fake()->bothify('VESSEL ###')),
            'year' => $yearTo,
            'year_from' => $yearFrom,
            'year_to' => $yearTo,
            'department' => 'Brokerage',
            'notes' => fake()->sentence(),
            'status' => LegacyBatchStatus::Draft,
            'expected_file_count' => 3,
            'uploaded_file_count' => 0,
            'failed_file_count' => 0,
            'total_size_bytes' => fake()->numberBetween(10_000, 10_000_000),
            'storage_disk' => (string) config('filesystems.default', 'local'),
            'uploaded_by' => User::factory(),
            'started_at' => null,
            'completed_at' => null,
            'last_activity_at' => now(),
        ];
    }

    public function completed(): self
    {
        return $this->state(fn () => [
            'status' => LegacyBatchStatus::Completed,
            'uploaded_file_count' => 3,
            'completed_at' => now(),
        ]);
    }
}
