<?php

namespace App\Support\Operations\Deletion\Transactions;

use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;

class TransactionDeletionPlan
{
    /**
     * @param  list<int>  $importIds
     * @param  list<int>  $exportIds
     * @param  list<int>  $documentIds
     * @param  list<string>  $documentPaths
     * @param  list<int>  $remarkIds
     */
    public function __construct(
        public readonly array $importIds,
        public readonly array $exportIds,
        public readonly array $documentIds,
        public readonly array $documentPaths,
        public readonly array $remarkIds,
        public readonly int $importStageCount,
        public readonly int $exportStageCount,
        public readonly int $existingAuditLogCount,
        public readonly string $storageDisk,
        public readonly string $connectionName,
    ) {}

    public function importCount(): int
    {
        return count($this->importIds);
    }

    public function exportCount(): int
    {
        return count($this->exportIds);
    }

    public function documentCount(): int
    {
        return count($this->documentIds);
    }

    public function remarkCount(): int
    {
        return count($this->remarkIds);
    }

    public function transactionCount(): int
    {
        return $this->importCount() + $this->exportCount();
    }

    /**
     * @return array<string, list<int>>
     */
    public function auditableSubjects(): array
    {
        return [
            ImportTransaction::class => $this->importIds,
            ExportTransaction::class => $this->exportIds,
            Document::class => $this->documentIds,
            TransactionRemark::class => $this->remarkIds,
        ];
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
     *     storage_disk: string
     * }
     */
    public function summary(): array
    {
        return [
            'import_count' => $this->importCount(),
            'export_count' => $this->exportCount(),
            'import_stage_count' => $this->importStageCount,
            'export_stage_count' => $this->exportStageCount,
            'document_count' => $this->documentCount(),
            'remark_count' => $this->remarkCount(),
            'audit_log_count' => $this->existingAuditLogCount,
            'transaction_count' => $this->transactionCount(),
            'storage_disk' => $this->storageDisk,
        ];
    }
}
