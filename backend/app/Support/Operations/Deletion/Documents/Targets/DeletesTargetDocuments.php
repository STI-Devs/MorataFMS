<?php

namespace App\Support\Operations\Deletion\Documents\Targets;

use App\Models\Document;
use App\Support\Operations\Deletion\Documents\DocumentDeletionPlan;

class DeletesTargetDocuments
{
    public function delete(DocumentDeletionPlan $plan): int
    {
        if ($plan->documentIds === []) {
            return 0;
        }

        return Document::on($plan->connectionName)->whereIn('id', $plan->documentIds)->delete();
    }
}
