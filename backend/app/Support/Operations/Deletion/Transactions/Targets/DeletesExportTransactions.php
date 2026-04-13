<?php

namespace App\Support\Operations\Deletion\Transactions\Targets;

use App\Models\ExportTransaction;
use App\Support\Operations\Deletion\Transactions\TransactionDeletionPlan;

class DeletesExportTransactions
{
    public function delete(TransactionDeletionPlan $plan): int
    {
        if ($plan->exportIds === []) {
            return 0;
        }

        return ExportTransaction::query()->whereIn('id', $plan->exportIds)->delete();
    }
}
