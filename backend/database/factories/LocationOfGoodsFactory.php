<?php

namespace Database\Factories;

use App\Models\LocationOfGoods;
use Faker\Factory as FakerFactory;
use Faker\Generator;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LocationOfGoods>
 */
class LocationOfGoodsFactory extends Factory
{
    protected static ?Generator $stableFaker = null;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $faker = static::faker();

        return [
            'name' => $faker->unique()->city().' Port',
            'is_active' => true,
        ];
    }

    protected static function faker(): Generator
    {
        return static::$stableFaker ??= FakerFactory::create(config('app.faker_locale'));
    }
}
