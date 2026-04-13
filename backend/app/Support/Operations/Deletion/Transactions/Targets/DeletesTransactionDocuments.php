<?php

namespace App\Support\Operations\Deletion\Transactions\Targets;

use App\Models\Document;
use App\Support\Operations\Deletion\Transactions\TransactionDeletionPlan;

class DeletesTransactionDocuments
{
    public function delete(TransactionDeletionPlan $plan): int
    {
        if ($plan->documentIds === []) {
            return 0;
        }

        return Document::query()->whereIn('id', $plan->documentIds)->delete();
    }
}
