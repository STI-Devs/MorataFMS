<?php

namespace App\Support\Operations\Deletion\Transactions;

use App\Support\Operations\Deletion\Shared\DeletesFilesForPaths;
use App\Support\Operations\Deletion\Shared\PurgesAuditLogsForSubjects;
use App\Support\Operations\Deletion\Transactions\Targets\DeletesExportTransactions;
use App\Support\Operations\Deletion\Transactions\Targets\DeletesImportTransactions;
use App\Support\Operations\Deletion\Transactions\Targets\DeletesTransactionDocuments;
use App\Support\Operations\Deletion\Transactions\Targets\DeletesTransactionRemarks;
use Illuminate\Support\Facades\DB;

class TransactionDeletionExecutor
{
    public function __construct(
        private DeletesTransactionRemarks $deletesTransactionRemarks,
        private DeletesTransactionDocuments $deletesTransactionDocuments,
        private DeletesImportTransactions $deletesImportTransactions,
        private DeletesExportTransactions $deletesExportTransactions,
        private PurgesAuditLogsForSubjects $purgesAuditLogsForSubjects,
        private DeletesFilesForPaths $deletesFilesForPaths,
    ) {}

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
    public function delete(TransactionDeletionPlan $plan, bool $deleteFiles = true): array
    {
        $deletedAuditLogCount = 0;

        DB::transaction(function () use ($plan, &$deletedAuditLogCount): void {
            $this->deletesTransactionRemarks->delete($plan);
            $this->deletesTransactionDocuments->delete($plan);
            $this->deletesImportTransactions->delete($plan);
            $this->deletesExportTransactions->delete($plan);
            $deletedAuditLogCount = $this->purgesAuditLogsForSubjects->delete($plan->auditableSubjects());
        });

        $fileDeletion = [
            'deleted_file_count' => 0,
            'failed_file_deletions' => [],
        ];

        if ($deleteFiles) {
            $fileDeletion = $this->deletesFilesForPaths->delete($plan->storageDisk, $plan->documentPaths);
        }

        return [
            ...$plan->summary(),
            'audit_log_count' => $deletedAuditLogCount,
            'kept_files' => ! $deleteFiles,
            'deleted_file_count' => $fileDeletion['deleted_file_count'],
            'failed_file_deletions' => $fileDeletion['failed_file_deletions'],
        ];
    }
}
