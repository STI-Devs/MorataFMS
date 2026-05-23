<?php

namespace App\Console\Commands;

use App\Enums\ArchiveZipExportStatus;
use App\Models\ArchiveZipExport;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class PruneExpiredArchiveZipExports extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'archive-zip-exports:prune-expired {--dry-run}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire old archive ZIP requests and delete their prepared ZIP files.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $count = 0;

        ArchiveZipExport::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->where('status', '!=', ArchiveZipExportStatus::Processing->value)
            ->where(function ($query): void {
                $query
                    ->where('status', '!=', ArchiveZipExportStatus::Expired->value)
                    ->orWhereNotNull('file_path');
            })
            ->chunkById(100, function ($archiveZipExports) use (&$count, $dryRun): void {
                foreach ($archiveZipExports as $archiveZipExport) {
                    $count++;

                    if ($dryRun) {
                        continue;
                    }

                    if ($archiveZipExport->file_path !== null) {
                        Storage::disk($archiveZipExport->storage_disk)->delete($archiveZipExport->file_path);
                    }

                    $archiveZipExport->forceFill([
                        'status' => ArchiveZipExportStatus::Expired,
                        'file_path' => null,
                        'file_size_bytes' => 0,
                    ])->save();
                }
            });

        $this->info($dryRun
            ? "{$count} expired archive ZIP request(s) would be pruned."
            : "{$count} expired archive ZIP request(s) pruned.");

        return self::SUCCESS;
    }
}
