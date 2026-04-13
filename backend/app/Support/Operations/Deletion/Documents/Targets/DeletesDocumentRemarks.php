<?php

namespace App\Support\Operations\Deletion\Documents\Targets;

use App\Models\TransactionRemark;
use App\Support\Operations\Deletion\Documents\DocumentDeletionPlan;

class DeletesDocumentRemarks
{
    public function delete(DocumentDeletionPlan $plan): int
    {
        if ($plan->remarkIds === []) {
            return 0;
        }

        return TransactionRemark::query()->whereIn('id', $plan->remarkIds)->delete();
    }
}
