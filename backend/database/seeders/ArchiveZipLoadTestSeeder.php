<?php

namespace Database\Seeders;

use App\Enums\ArchiveOrigin;
use App\Enums\ExportStatus;
use App\Enums\StageStatus;
use App\Enums\UserRole;
use App\Models\Client;
use App\Models\Country;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class ArchiveZipLoadTestSeeder extends Seeder
{
    private const YEAR = 2026;

    private const MONTH = 3;

    private const BL_COUNT = 500;

    private const BL_PREFIX = 'MZ202603';

    private const SHIPPER_NAME = 'MORATA ZIP LOAD TEST EXPORTER';

    private const DESTINATION_COUNTRY = 'Japan';

    /**
     * @var list<string>
     */
    private const DOCUMENT_TYPES = [
        'boc',
        'bl_generation',
        'phytosanitary',
        'co',
        'cil',
        'dccci',
        'billing',
    ];

    /**
     * @var array<string, string>
     */
    private const FILENAMES = [
        'boc' => 'BOC Export Declaration.pdf',
        'bl_generation' => 'Bill of Lading.pdf',
        'phytosanitary' => 'Phytosanitary Certificate.pdf',
        'co' => 'Certificate of Origin.pdf',
        'cil' => 'CIL Inspection Report.pdf',
        'dccci' => 'DCCCI Printing Proof.pdf',
        'billing' => 'Billing and Liquidation.pdf',
    ];

    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command?->error('Archive ZIP load-test seeding is blocked in production.');

            return;
        }

        $diskName = (string) config('filesystems.default', 'local');
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk($diskName);

        $admin = $this->adminUser();
        $shipper = $this->shipper();
        $destinationCountry = $this->destinationCountry();

        $this->deleteExistingSeed($disk);

        $this->command?->info(sprintf(
            'Seeding %s March %s export BL records on [%s] storage...',
            number_format(self::BL_COUNT),
            self::YEAR,
            $diskName,
        ));

        $fileCount = 0;

        for ($index = 1; $index <= self::BL_COUNT; $index++) {
            $transaction = $this->createExportTransaction($index, $admin, $shipper, $destinationCountry);
            $this->completeStages($transaction, $admin, $this->transactionDate($index));
            $fileCount += $this->createDocuments($transaction, $admin, $disk);

            if ($index % 100 === 0) {
                $this->command?->info("Seeded {$index} BL records...");
            }
        }

        $this->command?->info(sprintf(
            'Archive ZIP load-test seed complete: %s BLs and %s files in MAR %s EXPORTS.',
            number_format(self::BL_COUNT),
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

    private function shipper(): Client
    {
        return Client::query()->updateOrCreate(
            ['name' => self::SHIPPER_NAME],
            [
                'type' => 'exporter',
                'contact_person' => 'ZIP Load Test',
                'contact_email' => 'zip-load-test@example.test',
                'contact_phone' => '+63 900 000 0000',
                'address' => 'Local load-test seed data',
                'is_active' => true,
            ],
        );
    }

    private function destinationCountry(): Country
    {
        return Country::query()->updateOrCreate(
            ['name' => self::DESTINATION_COUNTRY],
            [
                'code' => 'JP',
                'type' => 'both',
                'is_active' => true,
            ],
        );
    }

    private function deleteExistingSeed(FilesystemAdapter $disk): void
    {
        $transactionIds = ExportTransaction::query()
            ->where('bl_no', 'like', self::BL_PREFIX.'%')
            ->pluck('id');

        if ($transactionIds->isEmpty()) {
            return;
        }

        Document::query()
            ->where('documentable_type', ExportTransaction::class)
            ->whereIn('documentable_id', $transactionIds)
            ->select(['id', 'path'])
            ->chunkById(250, function ($documents) use ($disk): void {
                foreach ($documents as $document) {
                    if ($document->path) {
                        $disk->delete($document->path);
                    }

                    $document->delete();
                }
            });

        ExportTransaction::query()
            ->whereKey($transactionIds)
            ->delete();

        $this->command?->info('Existing March ZIP load-test records were replaced.');
    }

    private function createExportTransaction(
        int $index,
        User $admin,
        Client $shipper,
        Country $destinationCountry,
    ): ExportTransaction {
        return ExportTransaction::withoutAuditing(function () use ($admin, $destinationCountry, $index, $shipper): ExportTransaction {
            $transaction = new ExportTransaction;
            $transaction->bl_no = $this->blNumber($index);
            $transaction->vessel = 'MV ZIP LOAD TEST '.str_pad((string) (($index % 12) + 1), 2, '0', STR_PAD_LEFT);
            $transaction->shipper_id = $shipper->id;
            $transaction->destination_country_id = $destinationCountry->id;
            $transaction->export_date = $this->transactionDate($index);
            $transaction->is_archive = true;
            $transaction->archived_at = $this->transactionDate($index);
            $transaction->archived_by = $admin->id;
            $transaction->archive_origin = ArchiveOrigin::DirectArchiveUpload;
            $transaction->assigned_user_id = $admin->id;
            $transaction->status = ExportStatus::Completed;
            $transaction->notes = 'Local ZIP load-test seed record.';
            $transaction->save();

            return $transaction;
        });
    }

    private function completeStages(ExportTransaction $transaction, User $admin, string $date): void
    {
        $stages = $transaction->stages()->firstOrCreate();
        $updates = [];

        foreach (ExportTransaction::documentStageMap() as $stageKey) {
            $updates["{$stageKey}_status"] = StageStatus::Completed->value;
            $updates["{$stageKey}_completed_at"] = $date;
            $updates["{$stageKey}_completed_by"] = $admin->id;
        }

        $stages->forceFill($updates)->save();
    }

    private function createDocuments(
        ExportTransaction $transaction,
        User $admin,
        FilesystemAdapter $disk,
    ): int {
        foreach (self::DOCUMENT_TYPES as $documentType) {
            $filename = self::FILENAMES[$documentType];
            $path = Document::generateS3Path(
                documentableType: ExportTransaction::class,
                documentableId: $transaction->id,
                type: $documentType,
                filename: $filename,
                blNo: $transaction->bl_no,
                year: self::YEAR,
                month: self::MONTH,
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
                $document->documentable_type = ExportTransaction::class;
                $document->documentable_id = $transaction->id;
                $document->uploaded_by = $admin->id;
                $document->save();
            });
        }

        return count(self::DOCUMENT_TYPES);
    }

    private function blNumber(int $index): string
    {
        return self::BL_PREFIX.str_pad((string) $index, 4, '0', STR_PAD_LEFT);
    }

    private function transactionDate(int $index): string
    {
        return sprintf('%s-%02d-%02d', self::YEAR, self::MONTH, (($index - 1) % 28) + 1);
    }

    private function documentContents(ExportTransaction $transaction, string $documentType, string $filename): string
    {
        return implode("\n", [
            'MorataFMS local archive ZIP load-test document',
            "BL: {$transaction->bl_no}",
            "Document type: {$documentType}",
            "Filename: {$filename}",
            'This is deterministic local seed content for ZIP download testing.',
            str_repeat('ZIP-SEED-DATA ', 20),
        ]);
    }
}
