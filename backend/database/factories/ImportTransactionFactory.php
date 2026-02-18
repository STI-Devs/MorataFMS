<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Country;
use App\Models\ImportTransaction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ImportTransaction>
 */
class ImportTransactionFactory extends Factory
{
    protected $model = ImportTransaction::class;

    public function definition(): array
    {
        return [
            'customs_ref_no' => 'REF-' . fake()->unique()->numerify('####-###'),
            'bl_no' => 'BL-' . fake()->unique()->numerify('########'),
            'selective_color' => fake()->randomElement(['green', 'yellow', 'red']),
            'importer_id' => Client::factory(),
            'origin_country_id' => Country::factory()->importOrigin(),
            'arrival_date' => fake()->dateTimeBetween('now', '+30 days'),
            'status' => fake()->randomElement(['pending', 'in_progress', 'completed']),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'pending',
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'completed',
        ]);
    }
}
