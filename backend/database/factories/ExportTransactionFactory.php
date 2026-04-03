<?php

namespace Database\Factories;

use App\Enums\ExportStatus;
use App\Models\Client;
use App\Models\ExportTransaction;
use Faker\Factory as FakerFactory;
use Faker\Generator;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExportTransaction>
 */
class ExportTransactionFactory extends Factory
{
    protected static ?Generator $stableFaker = null;

    protected $model = ExportTransaction::class;

    public function definition(): array
    {
        $faker = static::faker();

        return [
            'shipper_id' => Client::factory(),
            'bl_no' => 'BL-'.$faker->unique()->numerify('########'),
            'vessel' => 'MV '.$faker->lastName().' '.$faker->randomElement(['Star', 'Express', 'Voyager', 'Spirit']),
            'destination_country_id' => null,
            'assigned_user_id' => null,
            'status' => $faker->randomElement([ExportStatus::Pending, ExportStatus::Processing, ExportStatus::Completed]),
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
            'status' => ExportStatus::Pending,
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ExportStatus::Completed,
        ]);
    }
}
