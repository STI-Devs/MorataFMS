<?php

namespace Database\Seeders;

use App\Enums\ClientType;
use App\Enums\CountryType;
use App\Enums\ImportStatus;
use App\Enums\SelectiveColor;
use App\Enums\StageStatus;
use App\Models\Client;
use App\Models\Country;
use App\Models\Document;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AccountantBillingDemoSeeder extends Seeder
{
    use WithoutModelEvents;

    private const DEMO_CLIENT_NAME = 'Demo Vessel Billing Client';

    private const DEMO_VESSEL_NAME = 'MV Shared Ledger';

    private const DEMO_COUNTRY_CODE = 'JP';

    private const DEMO_TRANSACTION_COUNT = 5;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $accountant = $this->ensureUser(
            name: 'Accountant User',
            email: 'accountant@morata.com',
            jobTitle: 'Accountant',
            role: 'accounting',
        );
        $encoder = $this->ensureUser(
            name: 'Encoder User',
            email: 'encoder@morata.com',
            jobTitle: 'Encoder',
            role: 'encoder',
        );
        $country = $this->ensureCountry();
        $client = $this->ensureClient($country);

        $transactions = ImportTransaction::withoutAuditing(function () use ($client, $country, $encoder) {
            return collect(range(1, self::DEMO_TRANSACTION_COUNT))
                ->map(fn (int $index) => $this->seedReadyBillingImport(
                    index: $index,
                    client: $client,
                    country: $country,
                    encoder: $encoder,
                ));
        });

        $this->command?->info(
            sprintf(
                'Seeded %d accountant demo imports for vessel %s.',
                $transactions->count(),
                self::DEMO_VESSEL_NAME,
            ),
        );
        $this->command?->line('BLs: '.$transactions->pluck('bl_no')->implode(', '));
        $this->command?->line('Login: accountant@morata.com / password');
    }

    private function ensureUser(string $name, string $email, string $jobTitle, string $role): User
    {
        $user = User::query()->firstOrNew(['email' => $email]);

        $user->forceFill([
            'name' => $name,
            'email' => $email,
            'job_title' => $jobTitle,
            'role' => $role,
            'password' => 'password',
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),
            'is_active' => true,
        ]);

        $user->save();

        return $user;
    }

    private function ensureCountry(): Country
    {
        return Country::query()->firstOrCreate(
            ['code' => self::DEMO_COUNTRY_CODE],
            [
                'name' => 'Japan',
                'type' => CountryType::ImportOrigin->value,
                'is_active' => true,
            ],
        );
    }

    private function ensureClient(Country $country): Client
    {
        $client = Client::query()->firstOrNew(['name' => self::DEMO_CLIENT_NAME]);

        $client->forceFill([
            'type' => ClientType::Importer->value,
            'country_id' => $country->id,
            'contact_person' => 'Demo Accounting Contact',
            'contact_email' => 'demo-accounting-client@morata.test',
            'contact_phone' => '0900-555-0001',
            'address' => '1 Demo Ledger Street, Manila',
            'is_active' => true,
        ]);

        $client->save();

        return $client;
    }

    private function seedReadyBillingImport(int $index, Client $client, Country $country, User $encoder): ImportTransaction
    {
        $customsRef = sprintf('DEMO-ACC-BILL-%03d', $index);
        $blNumber = sprintf('BL-ACC-VESSEL-%03d', $index);
        $arrivalDate = Carbon::parse('2026-04-01')->addDays($index - 1);
        $stageCompletedAt = $arrivalDate->copy()->setTime(9 + $index, 0);

        $transaction = ImportTransaction::query()->firstOrNew([
            'customs_ref_no' => $customsRef,
        ]);

        $transaction->forceFill([
            'customs_ref_no' => $customsRef,
            'bl_no' => $blNumber,
            'vessel_name' => self::DEMO_VESSEL_NAME,
            'selective_color' => SelectiveColor::Green->value,
            'importer_id' => $client->id,
            'origin_country_id' => $country->id,
            'arrival_date' => $arrivalDate->toDateString(),
            'assigned_user_id' => $encoder->id,
            'status' => ImportStatus::Pending->value,
            'notes' => sprintf(
                'Accountant vessel billing demo #%d. All prerequisites are complete; only Billing and Liquidation is pending.',
                $index,
            ),
            'is_archive' => false,
        ]);
        $transaction->save();

        $this->clearDemoDocuments($transaction);
        $transaction->stages()->firstOrCreate();

        $transaction->stages()->update([
            'boc_status' => StageStatus::Completed->value,
            'boc_completed_at' => $stageCompletedAt,
            'boc_completed_by' => $encoder->id,
            'bonds_status' => StageStatus::Completed->value,
            'bonds_completed_at' => $stageCompletedAt,
            'bonds_completed_by' => $encoder->id,
            'bonds_not_applicable' => false,
            'ppa_status' => StageStatus::Completed->value,
            'ppa_completed_at' => $stageCompletedAt,
            'ppa_completed_by' => $encoder->id,
            'ppa_not_applicable' => false,
            'do_status' => StageStatus::Completed->value,
            'do_completed_at' => $stageCompletedAt,
            'do_completed_by' => $encoder->id,
            'port_charges_status' => StageStatus::Completed->value,
            'port_charges_completed_at' => $stageCompletedAt,
            'port_charges_completed_by' => $encoder->id,
            'port_charges_not_applicable' => false,
            'releasing_status' => StageStatus::Completed->value,
            'releasing_completed_at' => $stageCompletedAt,
            'releasing_completed_by' => $encoder->id,
            'billing_status' => StageStatus::Pending->value,
            'billing_completed_at' => null,
            'billing_completed_by' => null,
        ]);

        $transaction->unsetRelation('stages');

        return $transaction;
    }

    private function clearDemoDocuments(ImportTransaction $transaction): void
    {
        $disk = config('filesystems.default', 'local');

        $transaction->documents()
            ->get()
            ->each(function (Document $document) use ($disk): void {
                if ($document->path !== '') {
                    Storage::disk($disk)->delete($document->path);
                }

                $document->delete();
            });
    }
}
