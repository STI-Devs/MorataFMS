<?php

namespace Database\Factories;

use App\Models\Country;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Country>
 */
class CountryFactory extends Factory
{
    protected $model = Country::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->country(),
            'code' => fake()->unique()->countryCode(),
            'type' => 'both',
            'is_active' => true,
        ];
    }

    public function exportDestination(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => 'export_destination',
        ]);
    }

    public function importOrigin(): static
    {
        return $this->state(fn(array $attributes) => [
            'type' => 'import_origin',
        ]);
    }
}
