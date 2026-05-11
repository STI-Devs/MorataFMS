<?php

namespace Database\Seeders;

use App\Enums\ClientType;
use App\Enums\CountryType;
use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
use App\Enums\SelectiveColor;
use App\Enums\StageStatus;
use App\Models\Client;
use App\Models\Country;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;
use App\Support\Auth\UserAccess;
use Carbon\CarbonImmutable;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EncoderDashboardDemoSeeder extends Seeder
{
    use WithoutModelEvents;

    private const CLIENT_NAME = 'Demo Encoder Dashboard Client';

    private const IMPORT_PREFIX = 'DEMO-ENC-IMP-';

    private const EXPORT_PREFIX = 'DEMO-ENC-EXP-';

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $encoder = $this->ensureEncoder();
        $client = $this->ensureClient();
        $country = $this->ensureCountry();

        $this->clearDemoData();

        ImportTransaction::withoutAuditing(function () use ($encoder, $client, $country): void {
            $this->seedActiveImports($encoder, $client, $country);
            $this->seedCompletedImports($encoder, $client, $country);
        });

        ExportTransaction::withoutAuditing(function () use ($encoder, $client, $country): void {
            $this->seedActiveExports($encoder, $client, $country);
            $this->seedCompletedExports($encoder, $client, $country);
        });

        $this->command?->info('Seeded encoder dashboard demo data for encoder@morata.com / password.');
    }

    private function ensureEncoder(): User
    {
        $encoder = User::query()->firstOrNew(['email' => 'encoder@morata.com']);

        $encoder->forceFill([
            'name' => 'Encoder User',
            'email' => 'encoder@morata.com',
            'job_title' => 'Encoder',
            'role' => 'encoder',
            'departments' => UserAccess::departmentsForRole('encoder'),
            'password' => 'password',
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),
            'is_active' => true,
        ]);

        $encoder->save();

        return $encoder;
    }

    private function ensureClient(): Client
    {
        $client = Client::query()->firstOrNew(['name' => self::CLIENT_NAME]);

        $client->forceFill([
            'type' => ClientType::Both->value,
            'contact_person' => 'Demo Encoder Contact',
            'contact_email' => 'demo-encoder-client@morata.test',
            'contact_phone' => '0900-555-0101',
            'address' => '10 Demo Dashboard Street, Davao City',
            'is_active' => true,
        ]);

        $client->save();

        return $client;
    }

    private function ensureCountry(): Country
    {
        return Country::query()->firstOrCreate(
            ['code' => 'SG'],
            [
                'name' => 'Singapore',
                'type' => CountryType::Both->value,
                'is_active' => true,
            ],
        );
    }

    private function clearDemoData(): void
    {
        ImportTransaction::query()
            ->where('customs_ref_no', 'like', self::IMPORT_PREFIX.'%')
            ->get()
            ->each(function (ImportTransaction $transaction): void {
                $transaction->documents()->delete();
                $transaction->remarks()->delete();
                $transaction->delete();
            });

        ExportTransaction::query()
            ->where('bl_no', 'like', self::EXPORT_PREFIX.'%')
            ->get()
            ->each(function (ExportTransaction $transaction): void {
                $transaction->documents()->delete();
                $transaction->remarks()->delete();
                $transaction->delete();
            });
    }

    private function seedActiveImports(User $encoder, Client $client, Country $country): void
    {
        $this->createImport(
            index: 1,
            encoder: $encoder,
            client: $client,
            country: $country,
            status: ImportStatus::Processing,
            arrivalDate: CarbonImmutable::now()->addDays(2),
            createdAt: $this->currentMonthTimestamp(1),
            updatedAt: CarbonImmutable::now()->subDays(3),
            notes: 'Demo active import that should appear as needing an update.',
        );

        $this->createImport(
            index: 2,
            encoder: $encoder,
            client: $client,
            country: $country,
            status: ImportStatus::Pending,
            arrivalDate: CarbonImmutable::now()->addDays(5),
            createdAt: $this->currentMonthTimestamp(2),
            updatedAt: CarbonImmutable::now()->subHours(6),
            notes: 'Demo pending import due within the next seven days.',
        );
    }

    private function seedCompletedImports(User $encoder, Client $client, Country $country): void
    {
        $completeImport = $this->createImport(
            index: 3,
            encoder: $encoder,
            client: $client,
            country: $country,
            status: ImportStatus::Completed,
            arrivalDate: $this->currentMonthTimestamp(3),
            createdAt: $this->currentMonthTimestamp(3),
            updatedAt: $this->currentMonthTimestamp(3, 12),
            notes: 'Demo completed import with a full document set.',
        );

        $this->attachDocuments($completeImport, Document::requiredTypeKeysFor(ImportTransaction::class), $encoder);
        $completeImport->stages()->firstOrCreate()->update([
            'boc_status' => StageStatus::Completed->value,
            'boc_completed_at' => $this->currentMonthTimestamp(3, 9),
            'boc_completed_by' => $encoder->id,
            'bonds_status' => StageStatus::Completed->value,
            'bonds_completed_at' => $this->currentMonthTimestamp(3, 10),
            'bonds_completed_by' => $encoder->id,
            'ppa_status' => StageStatus::Completed->value,
            'ppa_completed_at' => $this->currentMonthTimestamp(3, 11),
            'ppa_completed_by' => $encoder->id,
            'do_status' => StageStatus::Completed->value,
            'do_completed_at' => $this->currentMonthTimestamp(3, 12),
            'do_completed_by' => $encoder->id,
            'port_charges_status' => StageStatus::Completed->value,
            'port_charges_completed_at' => $this->currentMonthTimestamp(3, 13),
            'port_charges_completed_by' => $encoder->id,
            'releasing_status' => StageStatus::Completed->value,
            'releasing_completed_at' => $this->currentMonthTimestamp(3, 14),
            'releasing_completed_by' => $encoder->id,
            'billing_status' => StageStatus::Completed->value,
            'billing_completed_at' => $this->currentMonthTimestamp(3, 15),
            'billing_completed_by' => $encoder->id,
        ]);

        $flaggedImport = $this->createImport(
            index: 4,
            encoder: $encoder,
            client: $client,
            country: $country,
            status: ImportStatus::Completed,
            arrivalDate: $this->currentMonthTimestamp(4),
            createdAt: $this->currentMonthTimestamp(4),
            updatedAt: $this->currentMonthTimestamp(4, 11),
            notes: 'Demo completed import with an unresolved remark and missing documents.',
        );

        $this->createRemark($flaggedImport, $encoder, 'Client invoice correction is still pending.');
    }

    private function seedActiveExports(User $encoder, Client $client, Country $country): void
    {
        $this->createExport(
            index: 1,
            encoder: $encoder,
            client: $client,
            country: $country,
            status: ExportStatus::Processing,
            exportDate: CarbonImmutable::now()->addDays(4),
            createdAt: $this->currentMonthTimestamp(1),
            updatedAt: CarbonImmutable::now()->subHours(5),
            notes: 'Demo active export leaving within the next seven days.',
        );

        $this->createExport(
            index: 2,
            encoder: $encoder,
            client: $client,
            country: $country,
            status: ExportStatus::InTransit,
            exportDate: CarbonImmutable::now()->addDays(9),
            createdAt: $this->currentMonthTimestamp(2),
            updatedAt: CarbonImmutable::now()->subDays(4),
            notes: 'Demo active export that should appear as needing an update.',
        );
    }

    private function seedCompletedExports(User $encoder, Client $client, Country $country): void
    {
        $completeExport = $this->createExport(
            index: 3,
            encoder: $encoder,
            client: $client,
            country: $country,
            status: ExportStatus::Completed,
            exportDate: $this->currentMonthTimestamp(3),
            createdAt: $this->currentMonthTimestamp(3),
            updatedAt: $this->currentMonthTimestamp(3, 12),
            notes: 'Demo completed export with a full document set.',
        );

        $this->attachDocuments($completeExport, Document::requiredTypeKeysFor(ExportTransaction::class), $encoder);
        $completeExport->stages()->firstOrCreate()->update([
            'docs_prep_status' => StageStatus::Completed->value,
            'docs_prep_completed_at' => $this->currentMonthTimestamp(3, 9),
            'docs_prep_completed_by' => $encoder->id,
            'bl_status' => StageStatus::Completed->value,
            'bl_completed_at' => $this->currentMonthTimestamp(3, 10),
            'bl_completed_by' => $encoder->id,
            'phytosanitary_status' => StageStatus::Completed->value,
            'phytosanitary_completed_at' => $this->currentMonthTimestamp(3, 11),
            'phytosanitary_completed_by' => $encoder->id,
            'co_status' => StageStatus::Completed->value,
            'co_completed_at' => $this->currentMonthTimestamp(3, 12),
            'co_completed_by' => $encoder->id,
            'cil_status' => StageStatus::Completed->value,
            'cil_completed_at' => $this->currentMonthTimestamp(3, 13),
            'cil_completed_by' => $encoder->id,
            'dccci_status' => StageStatus::Completed->value,
            'dccci_completed_at' => $this->currentMonthTimestamp(3, 14),
            'dccci_completed_by' => $encoder->id,
            'billing_status' => StageStatus::Completed->value,
            'billing_completed_at' => $this->currentMonthTimestamp(3, 15),
            'billing_completed_by' => $encoder->id,
        ]);

        $this->createExport(
            index: 4,
            encoder: $encoder,
            client: $client,
            country: $country,
            status: ExportStatus::Completed,
            exportDate: $this->currentMonthTimestamp(4),
            createdAt: $this->currentMonthTimestamp(4),
            updatedAt: $this->currentMonthTimestamp(4, 11),
            notes: 'Demo completed export that is intentionally missing required documents.',
        );
    }

    private function createImport(
        int $index,
        User $encoder,
        Client $client,
        Country $country,
        ImportStatus $status,
        CarbonImmutable $arrivalDate,
        CarbonImmutable $createdAt,
        CarbonImmutable $updatedAt,
        string $notes,
    ): ImportTransaction {
        $transaction = new ImportTransaction;
        $transaction->forceFill([
            'customs_ref_no' => self::IMPORT_PREFIX.str_pad((string) $index, 3, '0', STR_PAD_LEFT),
            'bl_no' => 'BL-'.self::IMPORT_PREFIX.str_pad((string) $index, 3, '0', STR_PAD_LEFT),
            'vessel_name' => 'MV Encoder Demo',
            'selective_color' => SelectiveColor::Green->value,
            'importer_id' => $client->id,
            'origin_country_id' => $country->id,
            'arrival_date' => $arrivalDate->toDateString(),
            'assigned_user_id' => $encoder->id,
            'status' => $status->value,
            'notes' => $notes,
            'is_archive' => false,
            'created_at' => $createdAt,
            'updated_at' => $updatedAt,
        ]);
        $transaction->save();
        $transaction->stages()->firstOrCreate();

        return $transaction;
    }

    private function createExport(
        int $index,
        User $encoder,
        Client $client,
        Country $country,
        ExportStatus $status,
        CarbonImmutable $exportDate,
        CarbonImmutable $createdAt,
        CarbonImmutable $updatedAt,
        string $notes,
    ): ExportTransaction {
        $transaction = new ExportTransaction;
        $transaction->forceFill([
            'shipper_id' => $client->id,
            'bl_no' => self::EXPORT_PREFIX.str_pad((string) $index, 3, '0', STR_PAD_LEFT),
            'vessel' => 'MV Encoder Demo',
            'destination_country_id' => $country->id,
            'export_date' => $exportDate->toDateString(),
            'assigned_user_id' => $encoder->id,
            'status' => $status->value,
            'notes' => $notes,
            'is_archive' => false,
            'created_at' => $createdAt,
            'updated_at' => $updatedAt,
        ]);
        $transaction->save();
        $transaction->stages()->firstOrCreate();

        return $transaction;
    }

    /**
     * @param  list<string>  $types
     */
    private function attachDocuments(ImportTransaction|ExportTransaction $transaction, array $types, User $encoder): void
    {
        foreach ($types as $index => $type) {
            $document = new Document;
            $document->forceFill([
                'documentable_type' => $transaction::class,
                'documentable_id' => $transaction->id,
                'type' => $type,
                'filename' => "{$type}-demo.pdf",
                'path' => "transaction-documents/demo/encoder/{$transaction->id}/{$type}.pdf",
                'size_bytes' => 2048 + $index,
                'version' => 1,
                'uploaded_by' => $encoder->id,
                'created_at' => $this->currentMonthTimestamp(3, 9 + $index),
                'updated_at' => $this->currentMonthTimestamp(3, 9 + $index),
            ]);
            $document->save();
        }
    }

    private function createRemark(ImportTransaction|ExportTransaction $transaction, User $encoder, string $message): void
    {
        $remark = new TransactionRemark;
        $remark->forceFill([
            'remarkble_type' => $transaction::class,
            'remarkble_id' => $transaction->id,
            'author_id' => $encoder->id,
            'severity' => 'warning',
            'message' => $message,
            'is_resolved' => false,
            'created_at' => $this->currentMonthTimestamp(4, 12),
            'updated_at' => $this->currentMonthTimestamp(4, 12),
        ]);
        $remark->save();
    }

    private function currentMonthTimestamp(int $dayOffset, int $hour = 9): CarbonImmutable
    {
        $start = CarbonImmutable::now()->startOfMonth()->setTime($hour, 0);
        $candidate = $start->addDays($dayOffset - 1);

        if ($candidate->greaterThan(CarbonImmutable::now())) {
            return CarbonImmutable::now();
        }

        return $candidate;
    }
}
