<?php

namespace App\Support\AdminDocumentReview;

use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AdminDocumentReviewData
{
    /**
     * @var array<string, list<string>>
     */
    private array $displayTypeKeysCache = [];

    /**
     * @var array<string, array<string, string>>
     */
    private array $optionalStageColumnsCache = [];

    public function normalizeTypeFilter(mixed $value): string
    {
        $normalized = strtolower(trim((string) $value));

        return in_array($normalized, ['import', 'export'], true) ? $normalized : 'all';
    }

    public function normalizeStatusFilter(mixed $value): string
    {
        $normalized = strtolower(trim((string) $value));

        return in_array($normalized, ['completed', 'cancelled'], true) ? $normalized : 'all';
    }

    public function normalizeReadinessFilter(mixed $value): string
    {
        $normalized = strtolower(trim((string) $value));

        return in_array($normalized, ['ready', 'missing_docs', 'flagged'], true) ? $normalized : 'all';
    }

    public function normalizeAssignedUserFilter(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        $assignedUserId = (int) $value;

        return $assignedUserId > 0 ? $assignedUserId : null;
    }

    public function importStatusValues(string $statusFilter): array
    {
        return match ($statusFilter) {
            'completed' => [ImportStatus::Completed->value],
            'cancelled' => [ImportStatus::Cancelled->value],
            default => [ImportStatus::Completed->value, ImportStatus::Cancelled->value],
        };
    }

    public function exportStatusValues(string $statusFilter): array
    {
        return match ($statusFilter) {
            'completed' => [ExportStatus::Completed->value],
            'cancelled' => [ExportStatus::Cancelled->value],
            default => [ExportStatus::Completed->value, ExportStatus::Cancelled->value],
        };
    }

    public function displayTypeKeysFor(string $type): array
    {
        return $this->displayTypeKeysCache[$type] ??= Document::requiredTypeKeysFor(
            $type === 'import' ? ImportTransaction::class : ExportTransaction::class,
        );
    }

    public function requiredTypeKeysFor(
        string $type,
        ImportTransaction|ExportTransaction|null $transaction = null,
    ): array {
        if ($transaction) {
            return $transaction->requiredDocumentTypeKeys();
        }

        return $this->displayTypeKeysFor($type);
    }

    public function importReferenceFor(ImportTransaction $transaction): string
    {
        return $transaction->customs_ref_no ?: 'IMP-'.str_pad((string) $transaction->id, 4, '0', STR_PAD_LEFT);
    }

    public function exportReferenceFor(ExportTransaction $transaction): string
    {
        return 'EXP-'.str_pad((string) $transaction->id, 4, '0', STR_PAD_LEFT);
    }

    public function countUploadedRequiredTypes(Collection $documents, array $requiredTypes): int
    {
        return $documents->pluck('type')->filter()->unique()->intersect($requiredTypes)->count();
    }

    public function readinessFor(bool $archiveReady, bool $hasExceptions): string
    {
        if ($hasExceptions) {
            return 'flagged';
        }

        return $archiveReady ? 'ready' : 'missing_docs';
    }

    public function hasUnresolvedRemarks(Collection $remarks): bool
    {
        return $remarks->contains(fn ($remark) => ! $remark->is_resolved);
    }

    public function finalizedDateForImport(ImportTransaction $transaction): mixed
    {
        return $transaction->stages?->billing_completed_at ?? $transaction->updated_at;
    }

    public function finalizedDateForExport(ExportTransaction $transaction): mixed
    {
        return $transaction->stages?->billing_completed_at ?? $transaction->updated_at;
    }

    public function formatDateTime(mixed $value): ?string
    {
        if (is_string($value) && $value !== '') {
            return Carbon::parse($value)->format(DateTimeInterface::ATOM);
        }

        if (! $value instanceof DateTimeInterface) {
            return null;
        }

        return $value->format(DateTimeInterface::ATOM);
    }

    public function formatDate(mixed $value): ?string
    {
        if (! $value instanceof DateTimeInterface) {
            return null;
        }

        return $value->format('Y-m-d');
    }

    public function mapQueueRows(Collection $items, Collection $imports, Collection $exports): array
    {
        $rows = [];

        foreach ($items as $item) {
            if ($item->type === 'import') {
                $transaction = $imports->get($item->id);

                if (! $transaction) {
                    continue;
                }

                $requiredTypes = $this->requiredTypeKeysFor('import', $transaction);
                $requiredCompleted = isset($item->docs_count)
                    ? (int) $item->docs_count
                    : $this->countUploadedRequiredTypes($transaction->documents, $requiredTypes);
                $requiredTotal = isset($item->docs_total)
                    ? (int) $item->docs_total
                    : count($requiredTypes);
                $hasExceptions = isset($item->has_exceptions)
                    ? (bool) $item->has_exceptions
                    : $this->hasUnresolvedRemarks($transaction->remarks);
                $archiveReady = $requiredCompleted >= $requiredTotal && ! $hasExceptions;

                $rows[] = [
                    'id' => $transaction->id,
                    'type' => 'import',
                    'ref' => $this->importReferenceFor($transaction),
                    'bl_number' => $transaction->bl_no,
                    'vessel' => $transaction->vessel_name,
                    'client' => $transaction->importer?->name,
                    'assigned_user' => $transaction->assignedUser?->name,
                    'assigned_user_id' => $transaction->assigned_user_id,
                    'status' => $transaction->status->value,
                    'transaction_date' => $this->formatDate($transaction->arrival_date),
                    'finalized_date' => $this->formatDateTime($item->finalized_at ?? $this->finalizedDateForImport($transaction)),
                    'docs_count' => $requiredCompleted,
                    'docs_total' => $requiredTotal,
                    'has_exceptions' => $hasExceptions,
                    'archive_ready' => $archiveReady,
                    'readiness' => $this->readinessFor($archiveReady, $hasExceptions),
                ];

                continue;
            }

            $transaction = $exports->get($item->id);

            if (! $transaction) {
                continue;
            }

            $requiredTypes = $this->requiredTypeKeysFor('export', $transaction);
            $requiredCompleted = isset($item->docs_count)
                ? (int) $item->docs_count
                : $this->countUploadedRequiredTypes($transaction->documents, $requiredTypes);
            $requiredTotal = isset($item->docs_total)
                ? (int) $item->docs_total
                : count($requiredTypes);
            $hasExceptions = isset($item->has_exceptions)
                ? (bool) $item->has_exceptions
                : $this->hasUnresolvedRemarks($transaction->remarks);
            $archiveReady = $requiredCompleted >= $requiredTotal && ! $hasExceptions;

            $rows[] = [
                'id' => $transaction->id,
                'type' => 'export',
                'ref' => $this->exportReferenceFor($transaction),
                'bl_number' => $transaction->bl_no,
                'vessel' => $transaction->vessel,
                'client' => $transaction->shipper?->name,
                'assigned_user' => $transaction->assignedUser?->name,
                'assigned_user_id' => $transaction->assigned_user_id,
                'status' => $transaction->status->value,
                'transaction_date' => $this->formatDate($transaction->export_date),
                'finalized_date' => $this->formatDateTime($item->finalized_at ?? $this->finalizedDateForExport($transaction)),
                'docs_count' => $requiredCompleted,
                'docs_total' => $requiredTotal,
                'has_exceptions' => $hasExceptions,
                'archive_ready' => $archiveReady,
                'readiness' => $this->readinessFor($archiveReady, $hasExceptions),
            ];
        }

        return $rows;
    }

    public function mapDetailTransaction(ImportTransaction|ExportTransaction $transaction, string $type): array
    {
        return [
            'id' => $transaction->id,
            'type' => $type,
            'ref' => $type === 'import'
                ? $this->importReferenceFor($transaction)
                : $this->exportReferenceFor($transaction),
            'bl_number' => $transaction->bl_no,
            'vessel' => $type === 'import'
                ? $transaction->vessel_name
                : $transaction->vessel,
            'client' => $type === 'import'
                ? $transaction->importer?->name
                : $transaction->shipper?->name,
            'assigned_user' => $transaction->assignedUser?->name,
            'assigned_user_id' => $transaction->assigned_user_id,
            'status' => $transaction->status->value,
            'transaction_date' => $this->formatDate(
                $type === 'import'
                    ? $transaction->arrival_date
                    : $transaction->export_date
            ),
            'finalized_date' => $this->formatDateTime(
                $type === 'import'
                    ? $this->finalizedDateForImport($transaction)
                    : $this->finalizedDateForExport($transaction)
            ),
        ];
    }

    public function countWithAllRequiredDocuments(Builder $query, string $type): int
    {
        $metricsQuery = $this->applyReadinessMetrics($query, $type);

        return $this->countMetricRows($metricsQuery, function ($metricQuery): void {
            $metricQuery->whereColumn('docs_count', '>=', 'docs_total');
        });
    }

    public function countArchiveReady(Builder $query, string $type): int
    {
        $metricsQuery = $this->applyReadinessMetrics($query, $type);

        return $this->countMetricRows($metricsQuery, function ($metricQuery): void {
            $metricQuery
                ->whereColumn('docs_count', '>=', 'docs_total')
                ->where('has_exceptions', 0);
        });
    }

    public function countMissingRequiredDocuments(Builder $query, string $type): int
    {
        $metricsQuery = $this->applyReadinessMetrics($query, $type);

        return $this->countMetricRows($metricsQuery, function ($metricQuery): void {
            $metricQuery->whereColumn('docs_count', '<', 'docs_total');
        });
    }

    public function applyReadinessFilter(Builder $query, string $type, string $readinessFilter): Builder
    {
        $this->applyReadinessMetrics($query, $type);

        return match ($readinessFilter) {
            'ready' => $query
                ->havingRaw('docs_count >= docs_total')
                ->having('has_exceptions', '=', 0),
            'missing_docs' => $query
                ->havingRaw('docs_count < docs_total')
                ->having('has_exceptions', '=', 0),
            'flagged' => $query->having('has_exceptions', '>', 0),
            default => $query,
        };
    }

    public function applyReadinessMetrics(Builder $query, string $type): Builder
    {
        [$transactionTable, $stageTable, $stageForeignKey, $documentableType] = $this->readinessTablesFor($type);
        $requiredTypes = $this->displayTypeKeysFor($type);
        $optionalStageColumns = $this->optionalStageColumnsFor($type);

        if (! $this->queryHasJoin($query, $stageTable)) {
            $query->leftJoin($stageTable, "{$stageTable}.{$stageForeignKey}", '=', "{$transactionTable}.id");
        }

        if (! $this->queryHasJoin($query, 'documents as review_documents')) {
            $query->leftJoin('documents as review_documents', function ($join) use (
                $transactionTable,
                $documentableType,
                $requiredTypes,
            ): void {
                $join
                    ->on('review_documents.documentable_id', '=', "{$transactionTable}.id")
                    ->where('review_documents.documentable_type', '=', $documentableType)
                    ->whereIn('review_documents.type', $requiredTypes);
            });
        }

        if (! $this->queryHasJoin($query, 'transaction_remarks as unresolved_review_remarks')) {
            $query->leftJoin('transaction_remarks as unresolved_review_remarks', function ($join) use (
                $transactionTable,
                $documentableType,
            ): void {
                $join
                    ->on('unresolved_review_remarks.remarkble_id', '=', "{$transactionTable}.id")
                    ->where('unresolved_review_remarks.remarkble_type', '=', $documentableType)
                    ->where('unresolved_review_remarks.is_resolved', '=', false);
            });
        }

        $documentCountExpressions = [];

        foreach ($requiredTypes as $typeKey) {
            $documentCountExpressions[] = "MAX(CASE WHEN review_documents.type = '{$typeKey}' THEN 1 ELSE 0 END)";
        }

        $requiredTotalExpressions = [];

        foreach ($requiredTypes as $typeKey) {
            $optionalStageColumn = $optionalStageColumns[$typeKey] ?? null;
            $requiredTotalExpressions[] = $optionalStageColumn === null
                ? '1'
                : "CASE WHEN {$optionalStageColumn} = 1 THEN 0 ELSE 1 END";
        }

        $query
            ->selectRaw(implode(' + ', $documentCountExpressions).' as docs_count')
            ->selectRaw(implode(' + ', $requiredTotalExpressions).' as docs_total')
            ->selectRaw('MAX(CASE WHEN unresolved_review_remarks.id IS NULL THEN 0 ELSE 1 END) as has_exceptions')
            ->groupBy($this->readinessGroupByColumns($transactionTable, $stageTable, $optionalStageColumns));

        return $query;
    }

    public function applyRequiredDocumentsConstraint(Builder $query, string $type): Builder
    {
        $optionalStageColumns = $this->optionalStageColumnsFor($type);

        foreach ($this->requiredTypeKeysFor($type) as $typeKey) {
            $optionalStageColumn = $optionalStageColumns[$typeKey] ?? null;

            if ($optionalStageColumn !== null) {
                $query->where(function (Builder $stageQuery) use ($optionalStageColumn, $typeKey) {
                    $stageQuery
                        ->where($optionalStageColumn, true)
                        ->orWhereHas('documents', function (Builder $documentQuery) use ($typeKey) {
                            $documentQuery->where('type', $typeKey);
                        });
                });

                continue;
            }

            $query->whereHas('documents', function (Builder $documentQuery) use ($typeKey) {
                $documentQuery->where('type', $typeKey);
            });
        }

        return $query;
    }

    public function applyMissingRequiredDocumentsConstraint(Builder $query, string $type): Builder
    {
        $optionalStageColumns = $this->optionalStageColumnsFor($type);

        foreach ($this->requiredTypeKeysFor($type) as $typeKey) {
            $optionalStageColumn = $optionalStageColumns[$typeKey] ?? null;

            if ($optionalStageColumn !== null) {
                $query->orWhere(function (Builder $missingStageQuery) use ($optionalStageColumn, $typeKey) {
                    $missingStageQuery
                        ->where(function (Builder $applicableStageQuery) use ($optionalStageColumn) {
                            $applicableStageQuery
                                ->whereNull($optionalStageColumn)
                                ->orWhere($optionalStageColumn, false);
                        })
                        ->whereDoesntHave('documents', function (Builder $documentQuery) use ($typeKey) {
                            $documentQuery->where('type', $typeKey);
                        });
                });

                continue;
            }

            $query->orWhereDoesntHave('documents', function (Builder $documentQuery) use ($typeKey) {
                $documentQuery->where('type', $typeKey);
            });
        }

        return $query;
    }

    public function optionalStageColumnsFor(string $type): array
    {
        return $this->optionalStageColumnsCache[$type] ??= match ($type) {
            'import' => [
                'bonds' => 'import_stages.bonds_not_applicable',
                'ppa' => 'import_stages.ppa_not_applicable',
                'port_charges' => 'import_stages.port_charges_not_applicable',
            ],
            'export' => [
                'phytosanitary' => 'export_stages.phytosanitary_not_applicable',
                'co' => 'export_stages.co_not_applicable',
                'dccci' => 'export_stages.dccci_not_applicable',
            ],
            default => [],
        };
    }

    public function exportReferenceExpression(): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "'EXP-' || printf('%04d', export_transactions.id)",
            default => "CONCAT('EXP-', LPAD(export_transactions.id, 4, '0'))",
        };
    }

    /**
     * @param  callable(\Illuminate\Database\Query\Builder): void  $constraint
     */
    private function countMetricRows(Builder $query, callable $constraint): int
    {
        $metricQuery = DB::query()->fromSub($query->toBase(), 'review_metrics');
        $constraint($metricQuery);

        return $metricQuery->count();
    }

    /**
     * @param  array<string, string>  $optionalStageColumns
     * @return array{0: string, 1: string, 2: string, 3: class-string<ImportTransaction>|class-string<ExportTransaction>}
     */
    private function readinessTablesFor(string $type): array
    {
        return match ($type) {
            'import' => ['import_transactions', 'import_stages', 'import_transaction_id', ImportTransaction::class],
            'export' => ['export_transactions', 'export_stages', 'export_transaction_id', ExportTransaction::class],
            default => throw new \InvalidArgumentException("Unsupported readiness type [{$type}]."),
        };
    }

    /**
     * @param  array<string, string>  $optionalStageColumns
     * @return list<string>
     */
    private function readinessGroupByColumns(string $transactionTable, string $stageTable, array $optionalStageColumns): array
    {
        return array_values([
            "{$transactionTable}.id",
            "{$transactionTable}.created_at",
            "{$transactionTable}.updated_at",
            "{$stageTable}.billing_completed_at",
            ...array_values($optionalStageColumns),
        ]);
    }

    private function queryHasJoin(Builder $query, string $table): bool
    {
        return collect($query->getQuery()->joins ?? [])
            ->contains(fn ($join): bool => $join->table === $table);
    }
}
