<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\ImportTransaction;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Faker\Generator;
use Illuminate\Database\Eloquent\Factories\Factory;

class DocumentFactory extends Factory
{
    protected static ?Generator $stableFaker = null;

    protected $model = Document::class;

    public function definition(): array
    {
        $faker = static::faker();

        return [
            'documentable_type' => ImportTransaction::class,
            'documentable_id' => ImportTransaction::factory(),
            'type' => $faker->randomElement(array_keys(Document::getTypeLabels())),
            'filename' => $faker->word().'.pdf',
            'path' => 'documents/test/'.$faker->uuid().'.pdf',
            'size_bytes' => $faker->numberBetween(1024, 5242880), // 1KB to 5MB
            'version' => 1,
            'uploaded_by' => User::factory(),
        ];
    }

    protected static function faker(): Generator
    {
        return static::$stableFaker ??= FakerFactory::create(config('app.faker_locale'));
    }
}
