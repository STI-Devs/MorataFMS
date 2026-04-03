<?php

namespace Database\Factories;

use App\Models\Client;
use Faker\Factory as FakerFactory;
use Faker\Generator;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Client>
 */
class ClientFactory extends Factory
{
    protected static ?Generator $stableFaker = null;

    protected $model = Client::class;

    public function definition(): array
    {
        $faker = static::faker();

        return [
            'name' => $faker->company(),
            'type' => $faker->randomElement(['importer', 'exporter', 'both']),
            'contact_person' => $faker->name(),
            'contact_email' => $faker->safeEmail(),
            'contact_phone' => $faker->phoneNumber(),
            'address' => $faker->address(),
            'is_active' => true,
        ];
    }

    protected static function faker(): Generator
    {
        return static::$stableFaker ??= FakerFactory::create(config('app.faker_locale'));
    }

    public function importer(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'importer',
        ]);
    }

    public function exporter(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'exporter',
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
