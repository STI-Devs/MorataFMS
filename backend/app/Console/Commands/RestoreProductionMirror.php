<?php

namespace App\Console\Commands;

use App\Support\Operations\ProductionMirrorManager;
use Illuminate\Console\Command;
use Throwable;

class RestoreProductionMirror extends Command
{
    protected $signature = 'ops:restore-production-mirror
                            {snapshot? : Snapshot filename relative to storage/app/production-mirror. Defaults to latest.sql}';

    protected $description = 'Restore the local production mirror database from the most recent saved snapshot.';

    public function __construct(private ProductionMirrorManager $productionMirrorManager)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $snapshot = $this->argument('snapshot');
        $snapshotLabel = $snapshot ?: 'latest.sql';

        $this->info("Restoring the local production mirror from [{$snapshotLabel}]...");

        try {
            $result = $this->productionMirrorManager->restore($snapshot);
        } catch (Throwable $throwable) {
            $this->error($throwable->getMessage());

            return self::FAILURE;
        }

        $this->info('Production mirror restore complete.');
        $this->line('Database: '.$result['database']);
        $this->line('Snapshot: '.$result['snapshot']);

        return self::SUCCESS;
    }
}
