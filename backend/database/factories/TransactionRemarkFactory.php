<?php

namespace Database\Factories;

use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Faker\Generator;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionRemarkFactory extends Factory
{
    protected static ?Generator $stableFaker = null;

    protected $model = TransactionRemark::class;

    public function definition(): array
    {
        $faker = static::faker();

        return [
            'remarkble_type' => ImportTransaction::class,
            'remarkble_id' => ImportTransaction::factory(),
            'author_id' => User::factory()->state(['role' => 'admin']),
            'severity' => $faker->randomElement(['info', 'warning', 'critical']),
            'message' => $faker->sentence(10),
            'is_resolved' => false,
            'resolved_by' => null,
            'resolved_at' => null,
        ];
    }

    protected static function faker(): Generator
    {
        return static::$stableFaker ??= FakerFactory::create(config('app.faker_locale'));
    }
}
