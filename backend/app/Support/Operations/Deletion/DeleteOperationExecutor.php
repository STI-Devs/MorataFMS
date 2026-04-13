<?php

namespace App\Support\Operations\Deletion;

use App\Support\Operations\Deletion\Documents\DocumentDeletionExecutor;
use App\Support\Operations\Deletion\Documents\DocumentDeletionPlan;
use App\Support\Operations\Deletion\Transactions\TransactionDeletionExecutor;
use App\Support\Operations\Deletion\Transactions\TransactionDeletionPlan;
use InvalidArgumentException;

class DeleteOperationExecutor
{
    public function __construct(
        private DocumentDeletionExecutor $documentDeletionExecutor,
        private TransactionDeletionExecutor $transactionDeletionExecutor,
    ) {}

    public function execute(object $plan, bool $deleteFiles = true): DeleteOperationResult
    {
        return match (true) {
            $plan instanceof DocumentDeletionPlan => new DeleteOperationResult('document', $this->documentDeletionExecutor->delete($plan, $deleteFiles)),
            $plan instanceof TransactionDeletionPlan => new DeleteOperationResult('transaction', $this->transactionDeletionExecutor->delete($plan, $deleteFiles)),
            default => throw new InvalidArgumentException('Unsupported delete operation plan.'),
        };
    }
}
