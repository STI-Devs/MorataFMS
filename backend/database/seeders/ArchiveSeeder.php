<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Country;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeds realistic PH customs brokerage archive data.
 *
 * Creates ~50 BL transactions (35 imports + 15 exports) across
 * 2022–2025 with varied months, clients, and document stages.
 * Deletes existing archive data before seeding.
 */
class ArchiveSeeder extends Seeder
{
    // Real shipping line BL prefixes used in PH ports
    private const IMPORT_BL_PREFIXES = [
        'MAEU',
        'MEDU',
        'HLCU',
        'OOLU',
        'EISU',
        'COSU',
        'CMDU',
        'APLU',
        'MSCU',
        'YMLU',
        'ZIMU',
        'ONEU',
        'KKFU',
        'PCIU',
        'WHLC',
    ];

    private const EXPORT_BL_PREFIXES = [
        'MAEU',
        'MEDU',
        'HLCU',
        'OOLU',
        'COSU',
        'YMLU',
    ];

    private const IMPORT_STAGES = ['boc', 'ppa', 'do', 'port_charges', 'releasing', 'billing'];
    private const EXPORT_STAGES = ['docs_prep', 'co', 'cil', 'bl'];
    private const SELECTIVE_COLORS = ['green', 'green', 'green', 'green', 'yellow', 'yellow', 'red'];

    // Real vessel names that dock at PH ports
    private const VESSELS = [
        'MV KOTA LARIS',
        'MV EVER GENTLE',
        'MV WAN HAI 326',
        'MV BANGKOK BRIDGE',
        'MV CAPE FORBY',
        'MV IRENES REMEDY',
        'MV MOL GATEWAY',
        'MV NYK VEGA',
        'MV FORTUNE CLOVER',
        'MV PACIFIC HARMONY',
        'MV STRAIT MAS',
        'MV TRANG AN 06',
    ];

    // Common origin countries for PH imports
    private const ORIGIN_COUNTRY_NAMES = [
        'China',
        'Japan',
        'South Korea',
        'Taiwan',
        'United States',
        'Thailand',
        'Germany',
        'Indonesia',
        'Singapore',
        'Vietnam',
    ];

    // Common export destinations from PH
    private const DESTINATION_COUNTRY_NAMES = [
        'Japan',
        'South Korea',
        'United States',
        'China',
        'Netherlands',
        'Germany',
        'United Kingdom',
        'Australia',
    ];

    // Realistic PH importer/exporter client names
    private const IMPORTERS = [
        'DOLE PHILIPPINES INC.',
        'ECO STEEL ROLLFORMING INDUSTRY INC.',
        'BUILD NEXT DISTRIBUTORS INC',
        'AKTIV MULTI TRADING CO. PHILS. INC.',
        'NJC MARKETING CORP.',
        'CI PHILIPPINES INC',
        'ZJM TRADING CORP.',
        'GARDENIA BAKERIES PHILS. INC.',
        'MEGA GLOBAL CORPORATION',
        'SAN MIGUEL BREWERY INC.',
    ];

    private const EXPORTERS = [
        'DOLE PHILIPPINES INC.',
        'ECO-EDGE HOME INTERIORS & SUPPLIES',
        'ADVENTIST DEVELOPMENT AND RELIEF AGENCY INC.',
        'PHILIPPINE BIBLE SOCIETY INC',
        'KIAPAT INC.',
        'DEL MONTE PHILIPPINES INC.',
        'CARGILL PHILIPPINES INC.',
    ];

    // Realistic document filenames per stage
    private const IMPORT_DOC_NAMES = [
        'boc' => ['BOC_Entry_Form.pdf', 'Commercial_Invoice.pdf', 'Packing_List.pdf'],
        'ppa' => ['PPA_Charges_Receipt.pdf', 'PPA_Assessment.pdf'],
        'do' => ['Delivery_Order.pdf', 'DO_Request_Form.pdf'],
        'port_charges' => ['Port_Charges_Statement.pdf', 'Arrastre_Wharfage.pdf'],
        'releasing' => ['Gate_Pass.pdf', 'Release_Certificate.pdf'],
        'billing' => ['Billing_Statement.pdf', 'Liquidation_Report.pdf'],
    ];

    private const EXPORT_DOC_NAMES = [
        'docs_prep' => ['Export_Declaration.pdf', 'Commercial_Invoice.pdf', 'Packing_List.pdf'],
        'co' => ['Certificate_of_Origin.pdf', 'CO_Application.pdf'],
        'cil' => ['DCCCI_Certificate.pdf', 'CIL_Inspection_Report.pdf'],
        'bl' => ['Bill_of_Lading_Final.pdf', 'BL_Draft.pdf'],
    ];

    /**
     * Distribution of BLs per year/month. Each entry = [year, month, importCount, exportCount]
     * Weighted toward more recent years (as brokers handle more volume over time).
     */
    private function getDistribution(): array
    {
        return [
            // 2022 — ~40 BLs (all 12 months)
            [2022, 1, 3, 1],
            [2022, 2, 2, 1],
            [2022, 3, 3, 1],
            [2022, 4, 2, 1],
            [2022, 5, 3, 1],
            [2022, 6, 2, 1],
            [2022, 7, 3, 1],
            [2022, 8, 2, 1],
            [2022, 9, 3, 1],
            [2022, 10, 2, 1],
            [2022, 11, 3, 1],
            [2022, 12, 2, 1],

            // 2023 — ~55 BLs (all 12 months)
            [2023, 1, 4, 2],
            [2023, 2, 3, 1],
            [2023, 3, 4, 2],
            [2023, 4, 3, 1],
            [2023, 5, 4, 2],
            [2023, 6, 3, 1],
            [2023, 7, 4, 2],
            [2023, 8, 3, 1],
            [2023, 9, 4, 2],
            [2023, 10, 3, 1],
            [2023, 11, 4, 2],
            [2023, 12, 3, 1],

            // 2024 — ~75 BLs (all 12 months)
            [2024, 1, 5, 2],
            [2024, 2, 4, 2],
            [2024, 3, 5, 2],
            [2024, 4, 4, 2],
            [2024, 5, 5, 2],
            [2024, 6, 4, 2],
            [2024, 7, 5, 2],
            [2024, 8, 4, 2],
            [2024, 9, 5, 2],
            [2024, 10, 4, 2],
            [2024, 11, 5, 2],
            [2024, 12, 4, 2],

            // 2025 — ~90 BLs (all 12 months, busiest year)
            [2025, 1, 7, 3],
            [2025, 2, 5, 2],
            [2025, 3, 7, 3],
            [2025, 4, 5, 2],
            [2025, 5, 6, 3],
            [2025, 6, 5, 2],
            [2025, 7, 6, 3],
            [2025, 8, 7, 2],
            [2025, 9, 5, 2],
            [2025, 10, 6, 3],
            [2025, 11, 5, 2],
            [2025, 12, 5, 2],
        ];
    }

    public function run(): void
    {
        $admin = User::where('email', 'admin@morata.com')->first();
        if (!$admin) {
            $this->command->error('Admin user not found. Run DatabaseSeeder first.');
            return;
        }

        // ── Delete existing archive data ──────────────────────────────────
        $this->command->info('🗑  Deleting existing archive data...');

        // Delete documents attached to archive transactions first
        $archiveImportIds = ImportTransaction::where('is_archive', true)->pluck('id');
        $archiveExportIds = ExportTransaction::where('is_archive', true)->pluck('id');

        Document::where(function ($q) use ($archiveImportIds) {
            $q->where('documentable_type', 'App\\Models\\ImportTransaction')
                ->whereIn('documentable_id', $archiveImportIds);
        })->orWhere(function ($q) use ($archiveExportIds) {
            $q->where('documentable_type', 'App\\Models\\ExportTransaction')
                ->whereIn('documentable_id', $archiveExportIds);
        })->delete();

        // Stages are cascade-deleted via FK, so just delete transactions
        ImportTransaction::where('is_archive', true)->delete();
        ExportTransaction::where('is_archive', true)->delete();

        $this->command->info('✅ Old archive data cleared.');

        // ── Ensure clients exist ──────────────────────────────────────────
        $this->ensureClients();

        // ── Resolve country IDs ───────────────────────────────────────────
        $originCountries = Country::whereIn('name', self::ORIGIN_COUNTRY_NAMES)->pluck('id', 'name');
        $destCountries = Country::whereIn('name', self::DESTINATION_COUNTRY_NAMES)->pluck('id', 'name');

        $importerIds = Client::whereIn('name', self::IMPORTERS)->pluck('id')->toArray();
        $exporterIds = Client::whereIn('name', self::EXPORTERS)->pluck('id')->toArray();

        $importCount = 0;
        $exportCount = 0;
        $docCount = 0;

        // ── Seed transactions per distribution ────────────────────────────
        foreach ($this->getDistribution() as [$year, $month, $impQty, $expQty]) {

            // --- Imports ---
            for ($i = 0; $i < $impQty; $i++) {
                $day = rand(1, 28); // safe day for all months
                $date = sprintf('%04d-%02d-%02d', $year, $month, $day);

                $blPrefix = self::IMPORT_BL_PREFIXES[array_rand(self::IMPORT_BL_PREFIXES)];
                $blNo = $blPrefix . rand(100000000, 999999999);
                $color = self::SELECTIVE_COLORS[array_rand(self::SELECTIVE_COLORS)];
                $originName = self::ORIGIN_COUNTRY_NAMES[array_rand(self::ORIGIN_COUNTRY_NAMES)];

                $txn = new ImportTransaction();
                $txn->customs_ref_no = 'ARCH-' . $date . '-' . strtoupper(substr(uniqid(), -6));
                $txn->bl_no = $blNo;
                $txn->selective_color = $color;
                $txn->importer_id = $importerIds[array_rand($importerIds)];
                $txn->origin_country_id = $originCountries[$originName] ?? null;
                $txn->arrival_date = $date;
                $txn->is_archive = true;
                $txn->assigned_user_id = $admin->id;
                $txn->status = 'completed';
                $txn->save();

                // Upload documents for random stages (3–6 stages completed)
                $stagesCompleted = rand(3, 6);
                $stages = array_slice(self::IMPORT_STAGES, 0, $stagesCompleted);
                $docCount += $this->seedDocuments($txn, 'import', $stages, self::IMPORT_DOC_NAMES, $blNo, $year, $month, $admin->id);

                // Mark completed stages on the stage record
                $this->completeImportStages($txn, $stages, $admin->id, $date);

                $importCount++;
            }

            // --- Exports ---
            for ($i = 0; $i < $expQty; $i++) {
                $day = rand(1, 28);
                $date = sprintf('%04d-%02d-%02d', $year, $month, $day);

                $blPrefix = self::EXPORT_BL_PREFIXES[array_rand(self::EXPORT_BL_PREFIXES)];
                $blNo = $blPrefix . rand(100000000, 999999999);
                $destName = self::DESTINATION_COUNTRY_NAMES[array_rand(self::DESTINATION_COUNTRY_NAMES)];
                $vessel = self::VESSELS[array_rand(self::VESSELS)];

                $txn = new ExportTransaction();
                $txn->bl_no = $blNo;
                $txn->vessel = $vessel;
                $txn->shipper_id = $exporterIds[array_rand($exporterIds)];
                $txn->destination_country_id = $destCountries[$destName] ?? null;
                $txn->export_date = $date;
                $txn->is_archive = true;
                $txn->assigned_user_id = $admin->id;
                $txn->status = 'completed';
                $txn->save();

                // Upload documents for random stages (2–4 stages completed)
                $stagesCompleted = rand(2, 4);
                $stages = array_slice(self::EXPORT_STAGES, 0, $stagesCompleted);
                $docCount += $this->seedDocuments($txn, 'export', $stages, self::EXPORT_DOC_NAMES, $blNo, $year, $month, $admin->id);

                // Mark completed stages
                $this->completeExportStages($txn, $stages, $admin->id, $date);

                $exportCount++;
            }
        }

        $total = $importCount + $exportCount;
        $this->command->info("✅ Archive seeded: {$importCount} imports + {$exportCount} exports = {$total} BLs, {$docCount} documents.");
    }

    /**
     * Ensure all expected clients exist.
     */
    private function ensureClients(): void
    {
        foreach (self::IMPORTERS as $name) {
            Client::updateOrCreate(
                ['name' => $name],
                ['type' => 'both', 'is_active' => true]
            );
        }
        foreach (self::EXPORTERS as $name) {
            Client::updateOrCreate(
                ['name' => $name],
                ['type' => 'both', 'is_active' => true]
            );
        }
    }

    /**
     * Create documents for completed stages of a transaction.
     * Each stage gets 1 document (randomly picked from the stage's filename list).
     */
    private function seedDocuments(
        ImportTransaction|ExportTransaction $txn,
        string $folder,
        array $stages,
        array $docNames,
        string $blNo,
        int $year,
        int $month,
        int $uploaderId,
    ): int {
        $count = 0;
        foreach ($stages as $stage) {
            $filenames = $docNames[$stage] ?? ['Document.pdf'];
            $filename = $filenames[array_rand($filenames)];

            $path = Document::generateS3Path(
                documentableType: get_class($txn),
                documentableId: $txn->id,
                type: $stage,
                filename: $filename,
                blNo: $blNo,
                year: $year,
                isArchive: true,
                month: $month,
            );

            $doc = new Document();
            $doc->type = $stage;
            $doc->filename = $filename;
            $doc->path = $path;
            $doc->size_bytes = rand(50_000, 5_000_000); // 50KB–5MB
            $doc->version = 1;
            $doc->documentable_type = get_class($txn);
            $doc->documentable_id = $txn->id;
            $doc->uploaded_by = $uploaderId;
            $doc->save();

            $count++;
        }
        return $count;
    }

    /**
     * Mark import stages as completed.
     */
    private function completeImportStages(ImportTransaction $txn, array $stages, int $userId, string $date): void
    {
        $stageRecord = $txn->stages;
        if (!$stageRecord)
            return;

        foreach ($stages as $stage) {
            $stageRecord->{$stage . '_status'} = 'completed';
            $stageRecord->{$stage . '_completed_at'} = $date;
            $stageRecord->{$stage . '_completed_by'} = $userId;
        }
        $stageRecord->save();
    }

    /**
     * Mark export stages as completed.
     */
    private function completeExportStages(ExportTransaction $txn, array $stages, int $userId, string $date): void
    {
        $stageRecord = $txn->stages;
        if (!$stageRecord)
            return;

        foreach ($stages as $stage) {
            $stageRecord->{$stage . '_status'} = 'completed';
            $stageRecord->{$stage . '_completed_at'} = $date;
            $stageRecord->{$stage . '_completed_by'} = $userId;
        }
        $stageRecord->save();
    }
}
