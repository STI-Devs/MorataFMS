<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Country;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    /**
     * Seed 50 import transactions and 50 export transactions.
     * Uses existing clients, countries, and the admin user.
     */
    public function run(): void
    {
        // Get seeded users
        $admin = User::where('email', 'admin@morata.com')->first();
        if (!$admin) {
            $this->command->error('Admin user not found. Run DatabaseSeeder first.');
            return;
        }

        $encoder = User::where('email', 'encoder@morata.com')->first();
        if (!$encoder) {
            $this->command->error('Encoder user not found. Run DatabaseSeeder first.');
            return;
        }

        // Get existing clients or create some
        $importers = Client::where('type', 'importer')
            ->orWhere('type', 'both')
            ->get();

        $exporters = Client::where('type', 'exporter')
            ->orWhere('type', 'both')
            ->get();

        // If no clients exist, create some
        if ($importers->isEmpty()) {
            $importers = Client::factory()->importer()->count(5)->create();
        }
        if ($exporters->isEmpty()) {
            $exporters = Client::factory()->exporter()->count(5)->create();
        }

        // Get countries for export destinations
        $countries = Country::all();

        // Alternate assignments: odd index → encoder, even index → admin
        $assignees = [$admin->id, $encoder->id];

        // --- Seed 50 Import Transactions ---
        $this->command->info('Seeding 50 import transactions...');

        ImportTransaction::withoutAuditing(function () use ($importers, $assignees) {
            ImportTransaction::factory()
                ->count(50)
                ->sequence(fn($sequence) => [
                    'importer_id' => $importers->random()->id,
                    'assigned_user_id' => $assignees[$sequence->index % 2],
                    'arrival_date' => fake()->dateTimeBetween('-30 days', '+60 days')->format('Y-m-d'),
                ])
                ->create();
        });

        // --- Seed 50 Export Transactions ---
        $this->command->info('Seeding 50 export transactions...');

        ExportTransaction::withoutAuditing(function () use ($exporters, $countries, $assignees) {
            ExportTransaction::factory()
                ->count(50)
                ->sequence(fn($sequence) => [
                    'shipper_id' => $exporters->random()->id,
                    'assigned_user_id' => $assignees[$sequence->index % 2],
                    'destination_country_id' => $countries->isNotEmpty() ? $countries->random()->id : null,
                ])
                ->create();
        });

        $this->command->info('✅ Seeded 50 imports + 50 exports successfully!');
    }
}
