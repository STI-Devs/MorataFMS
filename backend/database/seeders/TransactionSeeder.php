<?php

namespace Database\Seeders;

use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
use App\Enums\SelectiveColor;
use App\Models\Client;
use App\Models\Country;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

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
        if (! $admin) {
            $this->command->error('Admin user not found. Run DatabaseSeeder first.');

            return;
        }

        $encoder = User::where('email', 'encoder@morata.com')->first();
        if (! $encoder) {
            $this->command->error('Encoder user not found. Run DatabaseSeeder first.');

            return;
        }

        // Get existing clients or create some
        $importers = Client::where('type', 'importer')
            ->orWhere('type', 'both')
            ->get()
            ->values();

        $exporters = Client::where('type', 'exporter')
            ->orWhere('type', 'both')
            ->get()
            ->values();

        // If no clients exist, create some
        if ($importers->isEmpty()) {
            $importers = $this->seedFallbackClients('importer');
        }
        if ($exporters->isEmpty()) {
            $exporters = $this->seedFallbackClients('exporter');
        }

        // Get countries for export destinations
        $countries = Country::all()->values();

        // Alternate assignments: odd index → encoder, even index → admin
        $assignees = [$admin->id, $encoder->id];
        $batch = now()->format('YmdHis');

        // --- Seed 50 Import Transactions ---
        $this->command->info('Seeding 50 import transactions...');

        ImportTransaction::withoutAuditing(function () use ($assignees, $batch, $importers) {
            $statuses = [
                ImportStatus::Pending->value,
                ImportStatus::VesselArrived->value,
                ImportStatus::Processing->value,
                ImportStatus::Completed->value,
            ];

            $colors = [
                SelectiveColor::Green->value,
                SelectiveColor::Yellow->value,
                SelectiveColor::Red->value,
            ];

            foreach (range(1, 50) as $index) {
                $importer = $importers[($index - 1) % $importers->count()];

                $transaction = new ImportTransaction;
                $transaction->forceFill([
                    'customs_ref_no' => sprintf('REF-%s-%03d', $batch, $index),
                    'bl_no' => sprintf('IBL-%s-%03d', $batch, $index),
                    'selective_color' => $colors[($index - 1) % count($colors)],
                    'importer_id' => $importer->id,
                    'arrival_date' => now()->subDays(20)->addDays($index)->toDateString(),
                    'assigned_user_id' => $assignees[$index % 2],
                    'status' => $statuses[($index - 1) % count($statuses)],
                    'notes' => sprintf('Docker sample import transaction %03d', $index),
                    'is_archive' => false,
                ]);
                $transaction->save();
            }
        });

        // --- Seed 50 Export Transactions ---
        $this->command->info('Seeding 50 export transactions...');

        ExportTransaction::withoutAuditing(function () use ($assignees, $batch, $countries, $exporters) {
            $statuses = [
                ExportStatus::Pending->value,
                ExportStatus::InTransit->value,
                ExportStatus::Departure->value,
                ExportStatus::Processing->value,
                ExportStatus::Completed->value,
            ];

            $vessels = [
                'MV Atlas Star',
                'MV Pacific Voyager',
                'MV Luzon Express',
                'MV Harbor Spirit',
                'MV Meridian Crest',
            ];

            foreach (range(1, 50) as $index) {
                $exporter = $exporters[($index - 1) % $exporters->count()];
                $country = $countries->isNotEmpty()
                    ? $countries[($index - 1) % $countries->count()]
                    : null;

                $transaction = new ExportTransaction;
                $transaction->forceFill([
                    'shipper_id' => $exporter->id,
                    'bl_no' => sprintf('EBL-%s-%03d', $batch, $index),
                    'vessel' => $vessels[($index - 1) % count($vessels)],
                    'destination_country_id' => $country?->id,
                    'assigned_user_id' => $assignees[$index % 2],
                    'status' => $statuses[($index - 1) % count($statuses)],
                    'notes' => sprintf('Docker sample export transaction %03d', $index),
                    'export_date' => now()->subDays(10)->addDays($index)->toDateString(),
                    'is_archive' => false,
                ]);
                $transaction->save();
            }
        });

        $this->command->info('✅ Seeded 50 imports + 50 exports successfully!');
    }

    private function seedFallbackClients(string $type): Collection
    {
        return collect(range(1, 5))
            ->map(function (int $index) use ($type) {
                $client = Client::firstOrNew([
                    'name' => sprintf('Docker %s client %d', ucfirst($type), $index),
                ]);

                $client->forceFill([
                    'type' => $type,
                    'contact_person' => sprintf('%s Contact %d', ucfirst($type), $index),
                    'contact_email' => sprintf('%s%d@example.test', $type, $index),
                    'contact_phone' => sprintf('0900-000-%04d', $index),
                    'address' => sprintf('%d %s Street, Manila', $index, ucfirst($type)),
                    'is_active' => true,
                ]);
                $client->save();

                return $client;
            })
            ->values();
    }
}
