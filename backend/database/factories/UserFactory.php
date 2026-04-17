<?php

namespace Database\Factories;

use App\Models\User;
use Faker\Factory as FakerFactory;
use Faker\Generator;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    protected static ?Generator $stableFaker = null;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $faker = static::faker();

        return [
            'name' => $faker->name(),
            'email' => $faker->unique()->safeEmail(),
            'role' => 'encoder',
            'is_active' => true,
            'job_title' => $faker->randomElement(['Administrator', 'Lawyer', 'Paralegal', 'Encoder']),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    protected static function faker(): Generator
    {
        return static::$stableFaker ??= FakerFactory::create(config('app.faker_locale'));
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
