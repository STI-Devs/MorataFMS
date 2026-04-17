<?php

namespace App\Support\Operations\Deletion\Transactions\Targets;

use App\Models\ImportTransaction;
use App\Support\Operations\Deletion\Transactions\TransactionDeletionPlan;

class DeletesImportTransactions
{
    public function delete(TransactionDeletionPlan $plan): int
    {
        if ($plan->importIds === []) {
            return 0;
        }

        return ImportTransaction::on($plan->connectionName)->whereIn('id', $plan->importIds)->delete();
    }
}
