<?php

namespace App\Support\Operations\Deletion\LiveTransactions;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Support\Operations\Deletion\Transactions\TransactionDeletionExecutor;
use App\Support\Operations\Deletion\Transactions\TransactionDeletionPlan;
use App\Support\Operations\Deletion\Transactions\TransactionDeletionPlanner;

class LiveTransactionResetter
{
    public function __construct(
        private TransactionDeletionPlanner $transactionDeletionPlanner,
        private TransactionDeletionExecutor $transactionDeletionExecutor,
    ) {}

    public function summarize(string $connectionName): TransactionDeletionPlan
    {
        return $this->transactionDeletionPlanner->build(
            ImportTransaction::on($connectionName)
                ->where('is_archive', false)
                ->pluck('id')
                ->map(fn (mixed $id): int => (int) $id)
                ->all(),
            ExportTransaction::on($connectionName)
                ->where('is_archive', false)
                ->pluck('id')
                ->map(fn (mixed $id): int => (int) $id)
                ->all(),
            $connectionName,
        );
    }

    /**
     * @return array{
     *     import_count: int,
     *     export_count: int,
     *     import_stage_count: int,
     *     export_stage_count: int,
     *     document_count: int,
     *     remark_count: int,
     *     audit_log_count: int,
     *     transaction_count: int,
     *     storage_disk: string,
     *     kept_files: bool,
     *     deleted_file_count: int,
     *     failed_file_deletions: list<string>
     * }
     */
    public function reset(string $connectionName, bool $deleteFiles = true): array
    {
        return $this->transactionDeletionExecutor->delete($this->summarize($connectionName), $deleteFiles);
    }
}
