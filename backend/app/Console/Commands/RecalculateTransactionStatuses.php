<?php

namespace App\Console\Commands;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Illuminate\Console\Command;

class RecalculateTransactionStatuses extends Command
{
    protected $signature   = 'transactions:recalculate-statuses';
    protected $description = 'Backfill transaction statuses based on uploaded documents.';

    public function handle(): int
    {
        $imports = ImportTransaction::with('documents', 'stages')->get();
        $this->info("Recalculating {$imports->count()} import transaction(s)...");
        foreach ($imports as $tx) {
            $tx->recalculateStatus();
        }

        $exports = ExportTransaction::with('documents', 'stages')->get();
        $this->info("Recalculating {$exports->count()} export transaction(s)...");
        foreach ($exports as $tx) {
            $tx->recalculateStatus();
        }

        $this->info('Done!');
        return self::SUCCESS;
    }
}
