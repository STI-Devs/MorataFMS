<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentFactory extends Factory
{
    protected $model = Document::class;

    public function definition(): array
    {
        return [
            'documentable_type' => ImportTransaction::class,
            'documentable_id' => ImportTransaction::factory(),
            'type' => fake()->randomElement(array_keys(Document::getTypeLabels())),
            'filename' => fake()->word() . '.pdf',
            'path' => 'documents/test/' . fake()->uuid() . '.pdf',
            'size_bytes' => fake()->numberBetween(1024, 5242880), // 1KB to 5MB
            'version' => 1,
            'uploaded_by' => User::factory(),
        ];
    }
}
