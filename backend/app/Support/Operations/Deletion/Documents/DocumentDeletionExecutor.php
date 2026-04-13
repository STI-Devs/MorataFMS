<?php

namespace App\Support\Operations\Deletion\Documents;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Support\Operations\Deletion\Documents\Targets\DeletesDocumentRemarks;
use App\Support\Operations\Deletion\Documents\Targets\DeletesTargetDocuments;
use App\Support\Operations\Deletion\Shared\DeletesFilesForPaths;
use App\Support\Operations\Deletion\Shared\PurgesAuditLogsForSubjects;
use Illuminate\Support\Facades\DB;

class DocumentDeletionExecutor
{
    public function __construct(
        private DeletesDocumentRemarks $deletesDocumentRemarks,
        private DeletesTargetDocuments $deletesTargetDocuments,
        private PurgesAuditLogsForSubjects $purgesAuditLogsForSubjects,
        private DeletesFilesForPaths $deletesFilesForPaths,
    ) {}

    /**
     * @return array{
     *     document_count: int,
     *     remark_count: int,
     *     audit_log_count: int,
     *     storage_disk: string,
     *     kept_files: bool,
     *     deleted_file_count: int,
     *     failed_file_deletions: list<string>
     * }
     */
    public function delete(DocumentDeletionPlan $plan, bool $deleteFiles = true): array
    {
        $deletedAuditLogCount = 0;

        DB::connection($plan->connectionName)->transaction(function () use ($plan, &$deletedAuditLogCount): void {
            $this->deletesDocumentRemarks->delete($plan);
            $this->deletesTargetDocuments->delete($plan);
            $this->recalculateParentTransactions($plan);
            $deletedAuditLogCount = $this->purgesAuditLogsForSubjects->delete($plan->auditableSubjects(), $plan->connectionName);
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

    private function recalculateParentTransactions(DocumentDeletionPlan $plan): void
    {
        if ($plan->parentTransactions[ImportTransaction::class] !== []) {
            ImportTransaction::on($plan->connectionName)
                ->whereIn('id', $plan->parentTransactions[ImportTransaction::class])
                ->get()
                ->each(function (ImportTransaction $transaction): void {
                    $transaction->recalculateStatus();
                });
        }

        if ($plan->parentTransactions[ExportTransaction::class] !== []) {
            ExportTransaction::on($plan->connectionName)
                ->whereIn('id', $plan->parentTransactions[ExportTransaction::class])
                ->get()
                ->each(function (ExportTransaction $transaction): void {
                    $transaction->recalculateStatus();
                });
        }
    }
}
