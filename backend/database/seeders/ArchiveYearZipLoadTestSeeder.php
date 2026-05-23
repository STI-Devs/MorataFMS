<?php

namespace Database\Seeders;

use App\Enums\ArchiveOrigin;
use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
use App\Enums\SelectiveColor;
use App\Enums\StageStatus;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\Country;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Seeder;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class ArchiveYearZipLoadTestSeeder extends Seeder
{
    private const YEAR = 2025;

    private const BL_COUNT_PER_TYPE_PER_MONTH = 21;

    private const BL_PREFIX = 'FYZIP2025';

    /**
     * @var list<string>
     */
    private const REPLACEABLE_BL_PREFIXES = [
        'FYZIP2025',
        'FYZIP2026',
    ];

    private const IMPORTER_NAME = 'MORATA FY ZIP LOAD TEST IMPORTER';

    private const EXPORTER_NAME = 'MORATA FY ZIP LOAD TEST EXPORTER';

    private const ORIGIN_COUNTRY = 'China';

    private const DESTINATION_COUNTRY = 'Japan';

    /**
     * @var list<int>
     */
    private const MONTHS = [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
    ];

    /**
     * @var list<string>
     */
    private const IMPORT_DOCUMENT_TYPES = [
        'boc',
        'bonds',
        'ppa',
        'do',
    ];

    /**
     * @var list<string>
     */
    private const EXPORT_DOCUMENT_TYPES = [
        'boc',
        'bl_generation',
        'co',
        'cil',
    ];

    /**
     * @var array<string, string>
     */
    private const IMPORT_FILENAMES = [
        'boc' => 'BOC Entry Form.pdf',
        'bonds' => 'Surety Bond.pdf',
        'ppa' => 'PPA Assessment.pdf',
        'do' => 'Delivery Order.pdf',
    ];

    /**
     * @var array<string, string>
     */
    private const EXPORT_FILENAMES = [
        'boc' => 'Export Declaration.pdf',
        'bl_generation' => 'Bill of Lading Draft.pdf',
        'co' => 'Certificate of Origin.pdf',
        'cil' => 'CIL Inspection Report.pdf',
    ];

    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command?->error('Archive year ZIP load-test seeding is blocked in production.');

            return;
        }

        $diskName = (string) config('filesystems.default', 'local');
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk($diskName);

        $admin = $this->adminUser();
        $importer = $this->client(self::IMPORTER_NAME, 'importer');
        $exporter = $this->client(self::EXPORTER_NAME, 'exporter');
        $originCountry = $this->country(self::ORIGIN_COUNTRY, 'CN');
        $destinationCountry = $this->country(self::DESTINATION_COUNTRY, 'JP');

        $this->deleteExistingSeed($disk);

        $this->command?->info(sprintf(
            'Seeding FY %s archive ZIP load test with %s BL records across %s folders on [%s] storage...',
            self::YEAR,
            number_format($this->totalBlCount()),
            number_format(count(self::MONTHS) * 2),
            $diskName,
        ));

        $fileCount = 0;

        foreach (self::MONTHS as $month) {
            $fileCount += $this->createImportFolder($month, $admin, $importer, $originCountry, $disk);
            $fileCount += $this->createExportFolder($month, $admin, $exporter, $destinationCountry, $disk);
            $this->command?->info(sprintf(
                'Seeded %s imports and exports...',
                strtoupper(date('M', mktime(0, 0, 0, $month, 1))),
            ));
        }

        $this->command?->info(sprintf(
            'Archive year ZIP load-test seed complete: %s BLs and %s files in FY %s.',
            number_format($this->totalBlCount()),
            number_format($fileCount),
            self::YEAR,
        ));
    }

    private function adminUser(): User
    {
        return User::withoutAuditing(function (): User {
            $user = User::withTrashed()->firstOrNew(['email' => 'admin@morata.com']);

            if ($user->trashed()) {
                $user->restore();
            }

            $user->forceFill([
                'name' => 'Admin User',
                'email' => 'admin@morata.com',
                'job_title' => 'Administrator',
                'password' => 'password',
                'email_verified_at' => now(),
                'is_active' => true,
            ]);
            $user->role = UserRole::Admin;
            $user->save();

            return $user;
        });
    }

    private function client(string $name, string $type): Client
    {
        return Client::query()->updateOrCreate(
            ['name' => $name],
            [
                'type' => $type,
                'contact_person' => 'FY ZIP Load Test',
                'contact_email' => 'fy-zip-load-test@example.test',
                'contact_phone' => '+63 900 000 0000',
                'address' => 'Local year ZIP load-test seed data',
                'is_active' => true,
            ],
        );
    }

    private function country(string $name, string $code): Country
    {
        return Country::query()->updateOrCreate(
            ['name' => $name],
            [
                'code' => $code,
                'type' => 'both',
                'is_active' => true,
            ],
        );
    }

    private function deleteExistingSeed(FilesystemAdapter $disk): void
    {
        $importIds = $this->seedTransactionIds(ImportTransaction::query());
        $exportIds = $this->seedTransactionIds(ExportTransaction::query());

        $this->deleteDocuments($disk, ImportTransaction::class, $importIds->all());
        $this->deleteDocuments($disk, ExportTransaction::class, $exportIds->all());

        if ($importIds->isNotEmpty()) {
            ImportTransaction::withoutAuditing(fn () => ImportTransaction::query()->whereKey($importIds)->delete());
        }

        if ($exportIds->isNotEmpty()) {
            ExportTransaction::withoutAuditing(fn () => ExportTransaction::query()->whereKey($exportIds)->delete());
        }

        if ($importIds->isNotEmpty() || $exportIds->isNotEmpty()) {
            $this->command?->info('Existing FY ZIP load-test records were replaced.');
        }
    }

    /**
     * @return Collection<int, int>
     */
    private function seedTransactionIds(Builder $query): Collection
    {
        return $query
            ->where(function ($prefixQuery): void {
                foreach (self::REPLACEABLE_BL_PREFIXES as $prefix) {
                    $prefixQuery->orWhere('bl_no', 'like', $prefix.'%');
                }
            })
            ->pluck('id');
    }

    /**
     * @param  list<int>  $transactionIds
     */
    private function deleteDocuments(FilesystemAdapter $disk, string $transactionClass, array $transactionIds): void
    {
        if ($transactionIds === []) {
            return;
        }

        Document::query()
            ->where('documentable_type', $transactionClass)
            ->whereIn('documentable_id', $transactionIds)
            ->select(['id', 'path'])
            ->chunkById(250, function ($documents) use ($disk): void {
                foreach ($documents as $document) {
                    if ($document->path) {
                        $disk->delete($document->path);
                    }

                    Document::withoutAuditing(fn () => $document->delete());
                }
            });
    }

    private function createImportFolder(
        int $month,
        User $admin,
        Client $importer,
        Country $originCountry,
        FilesystemAdapter $disk,
    ): int {
        $fileCount = 0;

        for ($index = 1; $index <= self::BL_COUNT_PER_TYPE_PER_MONTH; $index++) {
            $transaction = ImportTransaction::withoutAuditing(function () use ($admin, $importer, $index, $month, $originCountry): ImportTransaction {
                $transaction = new ImportTransaction;
                $transaction->customs_ref_no = 'FYZIP-'.self::YEAR.'-'.$month.'-'.$index;
                $transaction->bl_no = $this->blNumber('IMP', $month, $index);
                $transaction->vessel_name = 'MV FY ZIP IMPORT '.str_pad((string) (($index % 10) + 1), 2, '0', STR_PAD_LEFT);
                $transaction->selective_color = SelectiveColor::Green;
                $transaction->importer_id = $importer->id;
                $transaction->origin_country_id = $originCountry->id;
                $transaction->arrival_date = $this->transactionDate($month, $index);
                $transaction->is_archive = true;
                $transaction->archived_at = $this->transactionDate($month, $index);
                $transaction->archived_by = $admin->id;
                $transaction->archive_origin = ArchiveOrigin::DirectArchiveUpload;
                $transaction->assigned_user_id = $admin->id;
                $transaction->status = ImportStatus::Completed;
                $transaction->notes = 'Local FY ZIP load-test import record.';
                $transaction->save();

                return $transaction;
            });

            $this->completeStages($transaction, ImportTransaction::documentStageMap(), $admin, $this->transactionDate($month, $index));
            $fileCount += $this->createDocuments(
                $transaction,
                self::IMPORT_DOCUMENT_TYPES,
                self::IMPORT_FILENAMES,
                $admin,
                $disk,
                $month,
            );
        }

        return $fileCount;
    }

    private function createExportFolder(
        int $month,
        User $admin,
        Client $exporter,
        Country $destinationCountry,
        FilesystemAdapter $disk,
    ): int {
        $fileCount = 0;

        for ($index = 1; $index <= self::BL_COUNT_PER_TYPE_PER_MONTH; $index++) {
            $transaction = ExportTransaction::withoutAuditing(function () use ($admin, $destinationCountry, $exporter, $index, $month): ExportTransaction {
                $transaction = new ExportTransaction;
                $transaction->bl_no = $this->blNumber('EXP', $month, $index);
                $transaction->vessel = 'MV FY ZIP EXPORT '.str_pad((string) (($index % 10) + 1), 2, '0', STR_PAD_LEFT);
                $transaction->shipper_id = $exporter->id;
                $transaction->destination_country_id = $destinationCountry->id;
                $transaction->export_date = $this->transactionDate($month, $index);
                $transaction->is_archive = true;
                $transaction->archived_at = $this->transactionDate($month, $index);
                $transaction->archived_by = $admin->id;
                $transaction->archive_origin = ArchiveOrigin::DirectArchiveUpload;
                $transaction->assigned_user_id = $admin->id;
                $transaction->status = ExportStatus::Completed;
                $transaction->notes = 'Local FY ZIP load-test export record.';
                $transaction->save();

                return $transaction;
            });

            $this->completeStages($transaction, ExportTransaction::documentStageMap(), $admin, $this->transactionDate($month, $index));
            $fileCount += $this->createDocuments(
                $transaction,
                self::EXPORT_DOCUMENT_TYPES,
                self::EXPORT_FILENAMES,
                $admin,
                $disk,
                $month,
            );
        }

        return $fileCount;
    }

    /**
     * @param  array<string, string>  $stageMap
     */
    private function completeStages(
        ImportTransaction|ExportTransaction $transaction,
        array $stageMap,
        User $admin,
        string $date,
    ): void {
        $stages = $transaction->stages()->firstOrCreate();
        $updates = [];

        foreach ($stageMap as $stageKey) {
            $updates["{$stageKey}_status"] = StageStatus::Completed->value;
            $updates["{$stageKey}_completed_at"] = $date;
            $updates["{$stageKey}_completed_by"] = $admin->id;
        }

        $stages->forceFill($updates)->save();
    }

    /**
     * @param  list<string>  $documentTypes
     * @param  array<string, string>  $filenames
     */
    private function createDocuments(
        ImportTransaction|ExportTransaction $transaction,
        array $documentTypes,
        array $filenames,
        User $admin,
        FilesystemAdapter $disk,
        int $month,
    ): int {
        foreach ($documentTypes as $documentType) {
            $filename = $filenames[$documentType];
            $path = Document::generateS3Path(
                documentableType: $transaction::class,
                documentableId: $transaction->id,
                type: $documentType,
                filename: $filename,
                blNo: $transaction->bl_no,
                year: self::YEAR,
                month: $month,
            );
            $contents = $this->documentContents($transaction, $documentType, $filename);

            $disk->put($path, $contents);

            Document::withoutAuditing(function () use ($admin, $contents, $documentType, $filename, $path, $transaction): void {
                $document = new Document;
                $document->type = $documentType;
                $document->filename = $filename;
                $document->path = $path;
                $document->size_bytes = strlen($contents);
                $document->version = 1;
                $document->documentable_type = $transaction::class;
                $document->documentable_id = $transaction->id;
                $document->uploaded_by = $admin->id;
                $document->save();
            });
        }

        return count($documentTypes);
    }

    private function totalBlCount(): int
    {
        return count(self::MONTHS) * self::BL_COUNT_PER_TYPE_PER_MONTH * 2;
    }

    private function blNumber(string $type, int $month, int $index): string
    {
        return self::BL_PREFIX.$type.str_pad((string) $month, 2, '0', STR_PAD_LEFT).str_pad((string) $index, 4, '0', STR_PAD_LEFT);
    }

    private function transactionDate(int $month, int $index): string
    {
        return sprintf('%s-%02d-%02d', self::YEAR, $month, (($index - 1) % 28) + 1);
    }

    private function documentContents(ImportTransaction|ExportTransaction $transaction, string $documentType, string $filename): string
    {
        return implode("\n", [
            'MorataFMS local FY archive ZIP load-test document',
            "BL: {$transaction->bl_no}",
            "Document type: {$documentType}",
            "Filename: {$filename}",
            'This deterministic seed content is used for full filing-year ZIP download testing.',
            str_repeat('FY-ZIP-SEED-DATA ', 20),
        ]);
    }
}
