<?php

namespace App\Support\Operations\Deletion;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Support\Operations\Deletion\Documents\DocumentDeletionPlanner;
use App\Support\Operations\Deletion\Transactions\TransactionDeletionPlanner;
use InvalidArgumentException;

class DeleteOperationPlanner
{
    public function __construct(
        private DocumentDeletionPlanner $documentDeletionPlanner,
        private TransactionDeletionPlanner $transactionDeletionPlanner,
    ) {}

    /**
     * @param  array{
     *     id: list<int>,
     *     bl_no: list<string>,
     *     type: string
     * }  $filters
     */
    public function plan(string $target, array $filters, string $connectionName): object
    {
        return match ($target) {
            'document' => $this->planDocuments($filters, $connectionName),
            'transaction' => $this->planTransactions($filters, $connectionName),
            default => throw new InvalidArgumentException("Unsupported delete target [{$target}]."),
        };
    }

    /**
     * @param  array{
     *     id: list<int>,
     *     bl_no: list<string>,
     *     type: string
     * }  $filters
     */
    private function planDocuments(array $filters, string $connectionName): object
    {
        if ($filters['id'] === []) {
            throw new InvalidArgumentException('The document target requires at least one --id value.');
        }

        if ($filters['bl_no'] !== []) {
            throw new InvalidArgumentException('The document target does not support --bl-no filters.');
        }

        return $this->documentDeletionPlanner->build($filters['id'], $connectionName);
    }

    /**
     * @param  array{
     *     id: list<int>,
     *     bl_no: list<string>,
     *     type: string
     * }  $filters
     */
    private function planTransactions(array $filters, string $connectionName): object
    {
        $type = $filters['type'];

        if (! in_array($type, ['import', 'export', 'any'], true)) {
            throw new InvalidArgumentException('The transaction target only supports --type=import, --type=export, or --type=any.');
        }

        if ($filters['id'] === [] && $filters['bl_no'] === []) {
            throw new InvalidArgumentException('The transaction target requires at least one --id or --bl-no filter.');
        }

        if ($filters['id'] !== [] && $type === 'any') {
            throw new InvalidArgumentException('The transaction target requires --type=import or --type=export when using --id.');
        }

        $importIds = [];
        $exportIds = [];

        if (in_array($type, ['import', 'any'], true)) {
            $importIds = ImportTransaction::on($connectionName)
                ->when($filters['id'] !== [] || $filters['bl_no'] !== [], function ($query) use ($filters): void {
                    $query->where(function ($scopedQuery) use ($filters): void {
                        if ($filters['id'] !== []) {
                            $scopedQuery->orWhereIn('id', $filters['id']);
                        }

                        if ($filters['bl_no'] !== []) {
                            $scopedQuery->orWhereIn('bl_no', $filters['bl_no']);
                        }
                    });
                })
                ->pluck('id')
                ->map(fn (mixed $id): int => (int) $id)
                ->unique()
                ->values()
                ->all();
        }

        if (in_array($type, ['export', 'any'], true)) {
            $exportIds = ExportTransaction::on($connectionName)
                ->when($filters['id'] !== [] || $filters['bl_no'] !== [], function ($query) use ($filters): void {
                    $query->where(function ($scopedQuery) use ($filters): void {
                        if ($filters['id'] !== []) {
                            $scopedQuery->orWhereIn('id', $filters['id']);
                        }

                        if ($filters['bl_no'] !== []) {
                            $scopedQuery->orWhereIn('bl_no', $filters['bl_no']);
                        }
                    });
                })
                ->pluck('id')
                ->map(fn (mixed $id): int => (int) $id)
                ->unique()
                ->values()
                ->all();
        }

        return $this->transactionDeletionPlanner->build($importIds, $exportIds, $connectionName);
    }
}
