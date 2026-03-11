<?php

namespace Database\Factories;

use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TransactionRemarkFactory extends Factory
{
    protected $model = TransactionRemark::class;

    public function definition(): array
    {
        return [
            'remarkble_type' => ImportTransaction::class,
            'remarkble_id' => ImportTransaction::factory(),
            'author_id' => User::factory()->state(['role' => 'admin']),
            'severity' => $this->faker->randomElement(['info', 'warning', 'critical']),
            'message' => $this->faker->sentence(10),
            'is_resolved' => false,
            'resolved_by' => null,
            'resolved_at' => null,
        ];
    }
}
