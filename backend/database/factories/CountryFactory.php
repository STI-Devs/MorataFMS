<?php

namespace Database\Factories;

use App\Models\Country;
use Faker\Factory as FakerFactory;
use Faker\Generator;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Country>
 */
class CountryFactory extends Factory
{
    protected static ?Generator $stableFaker = null;

    protected $model = Country::class;

    public function definition(): array
    {
        $faker = static::faker();

        return [
            'name' => $faker->unique()->country(),
            'code' => $faker->unique()->countryCode(),
            'type' => 'both',
            'is_active' => true,
        ];
    }

    protected static function faker(): Generator
    {
        return static::$stableFaker ??= FakerFactory::create(config('app.faker_locale'));
    }

    public function exportDestination(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'export_destination',
        ]);
    }

    public function importOrigin(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'import_origin',
        ]);
    }
}
