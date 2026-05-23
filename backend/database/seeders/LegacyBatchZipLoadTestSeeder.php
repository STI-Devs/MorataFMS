<?php

namespace Database\Seeders;

use App\Enums\LegacyBatchFileStatus;
use App\Enums\LegacyBatchModule;
use App\Enums\LegacyBatchStatus;
use App\Enums\UserRole;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use App\Models\LegacyBatchZipExport;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LegacyBatchZipLoadTestSeeder extends Seeder
{
    private const BATCH_NAME = 'MAERSK';

    private const ROOT_FOLDER = '2024 SEALAND';

    private const YEAR = 2024;

    private const FILE_COUNT = 6902;

    private const FOLDER_GROUP_COUNT = 324;

    private const LOGICAL_TOTAL_SIZE_BYTES = 5_744_518_758;

    /**
     * @var list<string>
     */
    private const VESSELS = [
        'ASIAN ACE',
        'MCC CEBU',
        'SEOUL GLOW',
        'VIVALDI',
        'HAMMONIA BEROLINA',
        'MCC SHENZHEN',
        'AS PIA',
        'AS SOPHIA',
        'LUDWIG SCHULTE',
    ];

    /**
     * @var list<string>
     */
    private const FOLDERS = [
        'CDO LOADING',
        'DVO LOADING',
        'Dole-Dalian',
        'Dole-Xingang',
        'Mkdc-Dalian',
        'Tadeco-Xingang',
        'Wao-Dalian',
    ];

    public function run(): void
    {
        if (app()->isProduction()) {
            $this->command?->error('Legacy batch ZIP load-test seeding is blocked in production.');

            return;
        }

        $diskName = (string) config('filesystems.default', 'local');
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk($diskName);

        $admin = $this->adminUser();

        $this->deleteExistingSeed($disk);

        $this->command?->info(sprintf(
            'Seeding %s legacy batch files for %s / %s on [%s] storage...',
            number_format(self::FILE_COUNT),
            self::BATCH_NAME,
            self::ROOT_FOLDER,
            $diskName,
        ));

        $batch = $this->createBatch($admin, $diskName);
        $this->createFiles($batch, $disk);

        $this->command?->info(sprintf(
            'Legacy batch ZIP load-test seed complete: %s files in %s.',
            number_format(self::FILE_COUNT),
            self::BATCH_NAME,
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

    private function createBatch(User $admin, string $diskName): LegacyBatch
    {
        return LegacyBatch::withoutAuditing(function () use ($admin, $diskName): LegacyBatch {
            $batch = new LegacyBatch;
            $batch->uuid = (string) Str::uuid();
            $batch->batch_name = self::BATCH_NAME;
            $batch->root_folder = self::ROOT_FOLDER;
            $batch->year = self::YEAR;
            $batch->year_from = self::YEAR;
            $batch->year_to = self::YEAR;
            $batch->department = 'Brokerage';
            $batch->module = LegacyBatchModule::Brokerage;
            $batch->notes = 'Local legacy batch ZIP load-test seed data.';
            $batch->status = LegacyBatchStatus::Completed;
            $batch->expected_file_count = self::FILE_COUNT;
            $batch->uploaded_file_count = self::FILE_COUNT;
            $batch->failed_file_count = 0;
            $batch->total_size_bytes = self::LOGICAL_TOTAL_SIZE_BYTES;
            $batch->storage_disk = $diskName;
            $batch->uploaded_by = $admin->id;
            $batch->started_at = now()->subDays(1);
            $batch->completed_at = now();
            $batch->last_activity_at = now();
            $batch->save();

            return $batch;
        });
    }

    private function createFiles(LegacyBatch $batch, FilesystemAdapter $disk): void
    {
        $rows = [];
        $now = now();
        $baseSize = intdiv(self::LOGICAL_TOTAL_SIZE_BYTES, self::FILE_COUNT);
        $remainder = self::LOGICAL_TOTAL_SIZE_BYTES % self::FILE_COUNT;

        for ($index = 1; $index <= self::FILE_COUNT; $index++) {
            $relativePath = $this->relativePath($index);
            $storagePath = "legacy-batches/{$batch->uuid}/{$relativePath}";
            $logicalSizeBytes = $baseSize + ($index <= $remainder ? 1 : 0);

            $disk->put($storagePath, $this->fileContents($index, $relativePath));

            $rows[] = [
                'legacy_batch_id' => $batch->id,
                'relative_path' => $relativePath,
                'relative_path_hash' => hash('sha256', $relativePath),
                'storage_path' => $storagePath,
                'filename' => basename($relativePath),
                'mime_type' => 'application/pdf',
                'size_bytes' => $logicalSizeBytes,
                'modified_at' => $now,
                'status' => LegacyBatchFileStatus::Uploaded->value,
                'uploaded_at' => $now,
                'failed_at' => null,
                'failure_reason' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if (count($rows) === 500) {
                LegacyBatchFile::query()->insert($rows);
                $rows = [];
            }

            if ($index % 1000 === 0) {
                $this->command?->info("Seeded {$index} legacy batch files...");
            }
        }

        if ($rows !== []) {
            LegacyBatchFile::query()->insert($rows);
        }
    }

    private function deleteExistingSeed(FilesystemAdapter $disk): void
    {
        LegacyBatch::query()
            ->where('batch_name', self::BATCH_NAME)
            ->where('root_folder', self::ROOT_FOLDER)
            ->with(['files', 'zipExports'])
            ->get()
            ->each(function (LegacyBatch $batch) use ($disk): void {
                foreach ($batch->files as $file) {
                    $disk->delete($file->storage_path);
                }

                foreach ($batch->zipExports as $zipExport) {
                    if ($zipExport->file_path !== null) {
                        Storage::disk($zipExport->storage_disk)->delete($zipExport->file_path);
                    }

                    LegacyBatchZipExport::withoutAuditing(fn () => $zipExport->delete());
                }

                LegacyBatchFile::withoutAuditing(fn () => $batch->files()->delete());
                LegacyBatch::withoutAuditing(fn () => $batch->delete());
            });
    }

    private function relativePath(int $index): string
    {
        $folderIndex = (($index - 1) % self::FOLDER_GROUP_COUNT) + 1;
        $week = (($folderIndex - 1) % 52) + 1;
        $voyageNumber = 350 + intdiv($folderIndex - 1, count(self::VESSELS));
        $vessel = self::VESSELS[($folderIndex - 1) % count(self::VESSELS)];
        $folder = self::FOLDERS[($folderIndex - 1) % count(self::FOLDERS)];
        $filename = sprintf('BL %04d.pdf', $index);

        return sprintf(
            '%s/WK %02d %s %03dN/%s/%s',
            self::ROOT_FOLDER,
            $week,
            $vessel,
            $voyageNumber,
            $folder,
            $filename,
        );
    }

    private function fileContents(int $index, string $relativePath): string
    {
        return implode("\n", [
            'MorataFMS local legacy batch ZIP load-test file.',
            'Batch: '.self::BATCH_NAME,
            'Root folder: '.self::ROOT_FOLDER,
            "File number: {$index}",
            "Relative path: {$relativePath}",
            str_repeat('LEGACY-BATCH-ZIP-SEED ', 8),
        ]);
    }
}
