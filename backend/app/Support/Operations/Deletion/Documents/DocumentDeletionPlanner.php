<?php

namespace App\Support\Operations\Deletion\Documents;

use App\Models\AuditLog;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;

class DocumentDeletionPlanner
{
    /**
     * @param  list<int>  $documentIds
     */
    public function build(array $documentIds, string $connectionName): DocumentDeletionPlan
    {
        $documents = Document::on($connectionName)
            ->whereIn('id', $documentIds)
            ->get(['id', 'path', 'documentable_type', 'documentable_id']);

        $resolvedDocumentIds = $documents
            ->pluck('id')
            ->map(fn (mixed $id): int => (int) $id)
            ->all();

        $documentPaths = $documents
            ->pluck('path')
            ->filter(fn (mixed $path): bool => is_string($path) && $path !== '')
            ->unique()
            ->values()
            ->all();

        $remarkIds = TransactionRemark::on($connectionName)
            ->whereIn('document_id', $resolvedDocumentIds)
            ->pluck('id')
            ->map(fn (mixed $id): int => (int) $id)
            ->all();

        $parentTransactions = [
            ImportTransaction::class => $documents
                ->where('documentable_type', ImportTransaction::class)
                ->pluck('documentable_id')
                ->map(fn (mixed $id): int => (int) $id)
                ->unique()
                ->values()
                ->all(),
            ExportTransaction::class => $documents
                ->where('documentable_type', ExportTransaction::class)
                ->pluck('documentable_id')
                ->map(fn (mixed $id): int => (int) $id)
                ->unique()
                ->values()
                ->all(),
        ];

        $existingAuditLogCount = 0;

        if ($resolvedDocumentIds !== [] || $remarkIds !== []) {
            $existingAuditLogCount = AuditLog::on($connectionName)
                ->where(function ($query) use ($resolvedDocumentIds, $remarkIds): void {
                    if ($resolvedDocumentIds !== []) {
                        $query->orWhere(function ($auditQuery) use ($resolvedDocumentIds): void {
                            $auditQuery
                                ->where('auditable_type', Document::class)
                                ->whereIn('auditable_id', $resolvedDocumentIds);
                        });
                    }

                    if ($remarkIds !== []) {
                        $query->orWhere(function ($auditQuery) use ($remarkIds): void {
                            $auditQuery
                                ->where('auditable_type', TransactionRemark::class)
                                ->whereIn('auditable_id', $remarkIds);
                        });
                    }
                })
                ->count();
        }

        return new DocumentDeletionPlan(
            documentIds: $resolvedDocumentIds,
            documentPaths: $documentPaths,
            remarkIds: $remarkIds,
            parentTransactions: $parentTransactions,
            existingAuditLogCount: $existingAuditLogCount,
            storageDisk: (string) config('filesystems.default', 'local'),
            connectionName: $connectionName,
        );
    }
}
