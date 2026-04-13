<?php

namespace App\Support\Operations\Deletion\Transactions;

use App\Models\AuditLog;
use App\Models\Document;
use App\Models\ExportStage;
use App\Models\ExportTransaction;
use App\Models\ImportStage;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;

class TransactionDeletionPlanner
{
    /**
     * @param  list<int>  $importIds
     * @param  list<int>  $exportIds
     */
    public function build(array $importIds, array $exportIds): TransactionDeletionPlan
    {
        $documentIds = [];

        if ($importIds !== [] || $exportIds !== []) {
            $documentIds = Document::query()
                ->where(function ($query) use ($importIds, $exportIds): void {
                    if ($importIds !== []) {
                        $query->orWhere(function ($documentQuery) use ($importIds): void {
                            $documentQuery
                                ->where('documentable_type', ImportTransaction::class)
                                ->whereIn('documentable_id', $importIds);
                        });
                    }

                    if ($exportIds !== []) {
                        $query->orWhere(function ($documentQuery) use ($exportIds): void {
                            $documentQuery
                                ->where('documentable_type', ExportTransaction::class)
                                ->whereIn('documentable_id', $exportIds);
                        });
                    }
                })
                ->pluck('id')
                ->map(fn (mixed $id): int => (int) $id)
                ->all();
        }

        $documentPaths = Document::query()
            ->whereIn('id', $documentIds)
            ->pluck('path')
            ->filter(fn (mixed $path): bool => is_string($path) && $path !== '')
            ->unique()
            ->values()
            ->all();

        $remarkIds = [];

        if ($importIds !== [] || $exportIds !== []) {
            $remarkIds = TransactionRemark::query()
                ->where(function ($query) use ($importIds, $exportIds): void {
                    if ($importIds !== []) {
                        $query->orWhere(function ($remarkQuery) use ($importIds): void {
                            $remarkQuery
                                ->where('remarkble_type', ImportTransaction::class)
                                ->whereIn('remarkble_id', $importIds);
                        });
                    }

                    if ($exportIds !== []) {
                        $query->orWhere(function ($remarkQuery) use ($exportIds): void {
                            $remarkQuery
                                ->where('remarkble_type', ExportTransaction::class)
                                ->whereIn('remarkble_id', $exportIds);
                        });
                    }
                })
                ->pluck('id')
                ->map(fn (mixed $id): int => (int) $id)
                ->all();
        }

        $existingAuditLogCount = 0;

        if ($importIds !== [] || $exportIds !== [] || $documentIds !== [] || $remarkIds !== []) {
            $existingAuditLogCount = AuditLog::query()
                ->where(function ($query) use ($importIds, $exportIds, $documentIds, $remarkIds): void {
                    if ($importIds !== []) {
                        $query->orWhere(function ($auditQuery) use ($importIds): void {
                            $auditQuery
                                ->where('auditable_type', ImportTransaction::class)
                                ->whereIn('auditable_id', $importIds);
                        });
                    }

                    if ($exportIds !== []) {
                        $query->orWhere(function ($auditQuery) use ($exportIds): void {
                            $auditQuery
                                ->where('auditable_type', ExportTransaction::class)
                                ->whereIn('auditable_id', $exportIds);
                        });
                    }

                    if ($documentIds !== []) {
                        $query->orWhere(function ($auditQuery) use ($documentIds): void {
                            $auditQuery
                                ->where('auditable_type', Document::class)
                                ->whereIn('auditable_id', $documentIds);
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

        $importStageCount = $importIds === []
            ? 0
            : ImportStage::query()->whereIn('import_transaction_id', $importIds)->count();

        $exportStageCount = $exportIds === []
            ? 0
            : ExportStage::query()->whereIn('export_transaction_id', $exportIds)->count();

        return new TransactionDeletionPlan(
            importIds: $importIds,
            exportIds: $exportIds,
            documentIds: $documentIds,
            documentPaths: $documentPaths,
            remarkIds: $remarkIds,
            importStageCount: $importStageCount,
            exportStageCount: $exportStageCount,
            existingAuditLogCount: $existingAuditLogCount,
            storageDisk: (string) config('filesystems.document_disk', 's3'),
        );
    }
}
