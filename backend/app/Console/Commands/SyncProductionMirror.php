<?php

namespace App\Console\Commands;

use App\Support\Operations\ProductionMirrorManager;
use Illuminate\Console\Command;
use Throwable;

class SyncProductionMirror extends Command
{
    protected $signature = 'ops:sync-production-mirror';

    protected $description = 'Refresh the local production mirror database from the production Railway MySQL source and save a restorable snapshot.';

    public function __construct(private ProductionMirrorManager $productionMirrorManager)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Refreshing the local production mirror from the production source...');

        try {
            $result = $this->productionMirrorManager->sync();
        } catch (Throwable $throwable) {
            $this->error($throwable->getMessage());

            return self::FAILURE;
        }

        $this->info('Production mirror refresh complete.');
        $this->line('Database: '.$result['database']);
        $this->line('Snapshot: '.$result['snapshot']);
        $this->line('Latest snapshot: '.$result['latest_snapshot']);

        return self::SUCCESS;
    }
}
