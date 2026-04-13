<?php

namespace App\Support\Operations\Deletion\Transactions\Targets;

use App\Models\TransactionRemark;
use App\Support\Operations\Deletion\Transactions\TransactionDeletionPlan;

class DeletesTransactionRemarks
{
    public function delete(TransactionDeletionPlan $plan): int
    {
        if ($plan->remarkIds === []) {
            return 0;
        }

        return TransactionRemark::on($plan->connectionName)->whereIn('id', $plan->remarkIds)->delete();
    }
}
