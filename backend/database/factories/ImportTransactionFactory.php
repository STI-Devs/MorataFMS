<?php

namespace Database\Factories;

use App\Enums\ImportStatus;
use App\Models\Client;
use App\Models\Country;
use App\Models\ImportTransaction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ImportTransaction>
 */
class ImportTransactionFactory extends Factory
{
    protected $model = ImportTransaction::class;

    public function definition(): array
    {
        return [
            'customs_ref_no' => 'REF-'.fake()->unique()->numerify('####-###'),
            'bl_no' => 'BL-'.fake()->unique()->numerify('########'),
            'selective_color' => fake()->randomElement(['green', 'yellow', 'red']),
            'importer_id' => Client::factory(),
            'origin_country_id' => Country::factory()->importOrigin(),
            'arrival_date' => fake()->dateTimeBetween('-2 years', 'now'),
            'status' => fake()->randomElement([ImportStatus::Pending, ImportStatus::Processing, ImportStatus::Completed]),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ImportStatus::Pending,
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ImportStatus::Completed,
        ]);
    }
}
