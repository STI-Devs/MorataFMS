<?php

namespace App\Support\Operations\Deletion\Documents;

use App\Models\Document;
use App\Models\TransactionRemark;

class DocumentDeletionPlan
{
    /**
     * @param  list<int>  $documentIds
     * @param  list<string>  $documentPaths
     * @param  list<int>  $remarkIds
     * @param  array<string, list<int>>  $parentTransactions
     */
    public function __construct(
        public readonly array $documentIds,
        public readonly array $documentPaths,
        public readonly array $remarkIds,
        public readonly array $parentTransactions,
        public readonly int $existingAuditLogCount,
        public readonly string $storageDisk,
        public readonly string $connectionName,
    ) {}

    public function documentCount(): int
    {
        return count($this->documentIds);
    }

    public function remarkCount(): int
    {
        return count($this->remarkIds);
    }

    /**
     * @return array<string, list<int>>
     */
    public function auditableSubjects(): array
    {
        return [
            Document::class => $this->documentIds,
            TransactionRemark::class => $this->remarkIds,
        ];
    }

    /**
     * @return array{
     *     document_count: int,
     *     remark_count: int,
     *     audit_log_count: int,
     *     storage_disk: string
     * }
     */
    public function summary(): array
    {
        return [
            'document_count' => $this->documentCount(),
            'remark_count' => $this->remarkCount(),
            'audit_log_count' => $this->existingAuditLogCount,
            'storage_disk' => $this->storageDisk,
        ];
    }
}
