<?php

namespace Database\Factories;

use App\Enums\ExportStatus;
use App\Models\Client;
use App\Models\ExportTransaction;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ExportTransaction>
 */
class ExportTransactionFactory extends Factory
{
    protected $model = ExportTransaction::class;

    public function definition(): array
    {
        return [
            'shipper_id' => Client::factory(),
            'bl_no' => 'BL-'.fake()->unique()->numerify('########'),
            'vessel' => 'MV '.fake()->lastName().' '.fake()->randomElement(['Star', 'Express', 'Voyager', 'Spirit']),
            'destination_country_id' => null,
            'assigned_user_id' => null,
            'status' => fake()->randomElement([ExportStatus::Pending, ExportStatus::Processing, ExportStatus::Completed]),
            'notes' => fake()->optional()->sentence(),
        ];
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
