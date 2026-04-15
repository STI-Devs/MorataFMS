<?php

namespace Database\Factories;

use App\Enums\ImportStatus;
use App\Models\Client;
use App\Models\Country;
use App\Models\ImportTransaction;
use Faker\Factory as FakerFactory;
use Faker\Generator;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ImportTransaction>
 */
class ImportTransactionFactory extends Factory
{
    protected static ?Generator $stableFaker = null;

    protected $model = ImportTransaction::class;

    public function definition(): array
    {
        $faker = static::faker();

        return [
            'customs_ref_no' => 'REF-'.$faker->unique()->numerify('####-###'),
            'bl_no' => 'BL-'.$faker->unique()->numerify('########'),
            'selective_color' => $faker->randomElement(['green', 'yellow', 'orange', 'red']),
            'importer_id' => Client::factory(),
            'origin_country_id' => Country::factory()->importOrigin(),
            'arrival_date' => $faker->dateTimeBetween('-2 years', 'now'),
            'status' => $faker->randomElement([ImportStatus::Pending, ImportStatus::Processing, ImportStatus::Completed]),
            'notes' => $faker->optional()->sentence(),
        ];
    }

    protected static function faker(): Generator
    {
        return static::$stableFaker ??= FakerFactory::create(config('app.faker_locale'));
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
