<?php

namespace App\Console\Commands;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Illuminate\Console\Command;

class RecalculateTransactionStatuses extends Command
{
    protected $signature = 'transactions:recalculate-statuses';

    protected $description = 'Backfill transaction statuses based on uploaded documents.';

    public function handle(): int
    {
        $importsCount = ImportTransaction::count();
        $this->info("Recalculating {$importsCount} import transaction(s)...");
        foreach (ImportTransaction::with('documents', 'stages')->lazyById(200) as $tx) {
            $tx->recalculateStatus();
        }

        $exportsCount = ExportTransaction::count();
        $this->info("Recalculating {$exportsCount} export transaction(s)...");
        foreach (ExportTransaction::with('documents', 'stages')->lazyById(200) as $tx) {
            $tx->recalculateStatus();
        }

        $this->info('Done!');

        return self::SUCCESS;
    }
}
