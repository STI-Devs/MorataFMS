<?php

namespace Database\Factories;

use App\Models\LegalParty;
use Faker\Factory as FakerFactory;
use Faker\Generator;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LegalParty>
 */
class LegalPartyFactory extends Factory
{
    protected static ?Generator $stableFaker = null;

    protected $model = LegalParty::class;

    public function definition(): array
    {
        $faker = static::faker();

        return [
            'name' => $faker->name(),
            'principal_address' => $faker->optional()->address(),
        ];
    }

    protected static function faker(): Generator
    {
        return static::$stableFaker ??= FakerFactory::create(config('app.faker_locale'));
    }
}
