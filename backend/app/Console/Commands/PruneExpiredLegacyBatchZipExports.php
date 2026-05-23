<?php

namespace App\Console\Commands;

use App\Enums\ArchiveZipExportStatus;
use App\Models\LegacyBatchZipExport;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PruneExpiredLegacyBatchZipExports extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'legacy-batch-zip-exports:prune-expired {--dry-run}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire old legacy batch ZIP requests and delete their prepared ZIP files.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $count = 0;

        LegacyBatchZipExport::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->where('status', '!=', ArchiveZipExportStatus::Processing->value)
            ->where(function ($query): void {
                $query
                    ->where('status', '!=', ArchiveZipExportStatus::Expired->value)
                    ->orWhereNotNull('file_path');
            })
            ->chunkById(100, function ($legacyBatchZipExports) use (&$count, $dryRun): void {
                foreach ($legacyBatchZipExports as $legacyBatchZipExport) {
                    $count++;

                    if ($dryRun) {
                        continue;
                    }

                    if ($legacyBatchZipExport->file_path !== null) {
                        Storage::disk($legacyBatchZipExport->storage_disk)->delete($legacyBatchZipExport->file_path);
                    }

                    $legacyBatchZipExport->forceFill([
                        'status' => ArchiveZipExportStatus::Expired,
                        'file_path' => null,
                        'file_size_bytes' => 0,
                    ])->save();
                }
            });

        $this->info($dryRun
            ? "{$count} expired legacy batch ZIP request(s) would be pruned."
            : "{$count} expired legacy batch ZIP request(s) pruned.");

        return self::SUCCESS;
    }
}
