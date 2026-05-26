<?php

namespace App\Queries\Dashboard;

use App\Enums\ArchiveOrigin;
use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
use App\Models\Client;
use App\Models\Document;
use App\Models\ExportStage;
use App\Models\ExportTransaction;
use App\Models\ImportStage;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;
use App\Support\AdminDocumentReview\AdminDocumentReviewData;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EncoderDashboardShowQuery
{
    private const NEEDS_UPDATE_AFTER_HOURS = 48;

    private const ATTENTION_ITEMS_LIMIT = 6;

    public function __construct(
        private AdminDocumentReviewData $reviewData,
    ) {}

    public function handle(User $encoder): array
    {
        return [
            'kpis' => $this->kpis($encoder),
            'reports' => $this->reports($encoder),
            'analytics' => $this->analytics($encoder),
            'attention_items' => $this->attentionItems($encoder),
        ];
    }

    private function kpis(User $encoder): array
    {
        $needsUpdateThreshold = CarbonImmutable::now()->subHours(self::NEEDS_UPDATE_AFTER_HOURS);
        $upcomingStart = CarbonImmutable::now()->startOfDay();
        $upcomingEnd = CarbonImmutable::now()->addDays(7)->endOfDay();
        $importKpiRow = $this->aggregateAssignedTransactionKpis(
            ImportTransaction::query(),
            $encoder,
            $this->activeImportStatuses(),
            'arrival_date',
            $needsUpdateThreshold,
            $upcomingStart,
            $upcomingEnd,
        );
        $exportKpiRow = $this->aggregateAssignedTransactionKpis(
            ExportTransaction::query(),
            $encoder,
            $this->activeExportStatuses(),
            'export_date',
            $needsUpdateThreshold,
            $upcomingStart,
            $upcomingEnd,
        );

        return [
            'active_imports' => (int) ($importKpiRow->active_count ?? 0),
            'active_exports' => (int) ($exportKpiRow->active_count ?? 0),
            'needs_update' => (int) ($importKpiRow->delayed_count ?? 0) + (int) ($exportKpiRow->delayed_count ?? 0),
            'upcoming_eta_etd' => (int) ($importKpiRow->upcoming_count ?? 0) + (int) ($exportKpiRow->upcoming_count ?? 0),
            'open_remarks' => $this->countOpenRemarks($encoder),
            'document_gaps' => $this->reviewData->countMissingRequiredDocuments(
                ImportTransaction::query()
                    ->where('assigned_user_id', $encoder->id)
                    ->where('is_archive', false)
                    ->whereIn('status', $this->terminalImportStatuses()),
                'import',
            ) + $this->reviewData->countMissingRequiredDocuments(
                ExportTransaction::query()
                    ->where('assigned_user_id', $encoder->id)
                    ->where('is_archive', false)
                    ->whereIn('status', $this->terminalExportStatuses()),
                'export',
            ),
        ];
    }

    private function attentionItems(User $encoder): array
    {
        return collect()
            ->merge($this->staleActiveImports($encoder))
            ->merge($this->staleActiveExports($encoder))
            ->merge($this->openRemarkItems($encoder))
            ->merge($this->missingDocumentImports($encoder))
            ->merge($this->missingDocumentExports($encoder))
            ->sortByDesc('sort_at')
            ->take(self::ATTENTION_ITEMS_LIMIT)
            ->values()
            ->map(fn (array $item): array => collect($item)->except('sort_at')->all())
            ->all();
    }

    private function reports(User $encoder): array
    {
        $now = CarbonImmutable::now();
        $year = $now->year;
        $month = $now->month;

        return [
            'year' => $year,
            'month' => $month,
            'monthly_volume' => [
                'year' => $year,
                ...$this->monthlyVolume($encoder, $year),
            ],
            'client_volume' => $this->clientVolume($encoder, $year, $month),
            'turnaround' => $this->turnaround($encoder, $year, $month),
        ];
    }

    private function analytics(User $encoder): array
    {
        $now = CarbonImmutable::now();
        $monthStart = $now->startOfMonth();
        $monthEnd = $monthStart->addMonth();
        $yearStart = $now->startOfYear();
        $yearEnd = $yearStart->addYear();

        return [
            'year' => $now->year,
            'month' => $now->month,
            'activity' => [
                'transactions_completed' => [
                    'this_month' => $this->completedTransactionStats($encoder, $monthStart, $monthEnd),
                    'this_year' => $this->completedTransactionStats($encoder, $yearStart, $yearEnd),
                ],
                'documents_uploaded' => [
                    'this_month' => $this->documentUploadStats($encoder, $monthStart, $monthEnd),
                    'this_year' => $this->documentUploadStats($encoder, $yearStart, $yearEnd),
                ],
                'stages_completed' => [
                    'this_month' => $this->stageCompletionStats($encoder, $monthStart, $monthEnd),
                    'this_year' => $this->stageCompletionStats($encoder, $yearStart, $yearEnd),
                ],
                'records_finalized' => [
                    'this_month' => $this->finalizedRecordStats($encoder, $monthStart, $monthEnd),
                    'this_year' => $this->finalizedRecordStats($encoder, $yearStart, $yearEnd),
                ],
            ],
            'status_breakdown' => $this->statusBreakdown($encoder),
            'overdue_transactions' => $this->overdueTransactions($encoder),
        ];
    }

    private function monthlyVolume(User $encoder, int $year): array
    {
        [$start, $end] = $this->periodBounds($year);

        $imports = $this->monthlyCounts(
            $this->reportableAssignedImports($encoder)
                ->where('created_at', '>=', $start)
                ->where('created_at', '<', $end)
        );

        $exports = $this->monthlyCounts(
            $this->reportableAssignedExports($encoder)
                ->where('created_at', '>=', $start)
                ->where('created_at', '<', $end)
        );

        $months = [];
        $totalImports = 0;
        $totalExports = 0;

        for ($month = 1; $month <= 12; $month++) {
            $importCount = (int) $imports->get($month, 0);
            $exportCount = (int) $exports->get($month, 0);

            $totalImports += $importCount;
            $totalExports += $exportCount;

            $months[] = [
                'month' => $month,
                'imports' => $importCount,
                'exports' => $exportCount,
                'total' => $importCount + $exportCount,
            ];
        }

        return [
            'months' => $months,
            'total_imports' => $totalImports,
            'total_exports' => $totalExports,
            'total' => $totalImports + $totalExports,
        ];
    }

    private function clientVolume(User $encoder, int $year, ?int $month = null): array
    {
        [$start, $end] = $this->periodBounds($year, $month);

        $clientsTable = (new Client)->getTable();

        $importCounts = $this->reportableAssignedImports($encoder, 'import_transactions')
            ->where('import_transactions.created_at', '>=', $start)
            ->where('import_transactions.created_at', '<', $end)
            ->join($clientsTable, 'import_transactions.importer_id', '=', "{$clientsTable}.id")
            ->selectRaw("{$clientsTable}.id as client_id, {$clientsTable}.name as client_name, {$clientsTable}.type as client_type, COUNT(*) as imports")
            ->groupBy("{$clientsTable}.id", "{$clientsTable}.name", "{$clientsTable}.type")
            ->get()
            ->keyBy('client_id');

        $exportCounts = $this->reportableAssignedExports($encoder, 'export_transactions')
            ->where('export_transactions.created_at', '>=', $start)
            ->where('export_transactions.created_at', '<', $end)
            ->join($clientsTable, 'export_transactions.shipper_id', '=', "{$clientsTable}.id")
            ->selectRaw("{$clientsTable}.id as client_id, {$clientsTable}.name as client_name, {$clientsTable}.type as client_type, COUNT(*) as exports")
            ->groupBy("{$clientsTable}.id", "{$clientsTable}.name", "{$clientsTable}.type")
            ->get()
            ->keyBy('client_id');

        $clients = $importCounts
            ->keys()
            ->merge($exportCounts->keys())
            ->unique()
            ->map(function (mixed $clientId) use ($importCounts, $exportCounts): array {
                $importRecord = $importCounts->get($clientId);
                $exportRecord = $exportCounts->get($clientId);
                $imports = (int) ($importRecord?->imports ?? 0);
                $exports = (int) ($exportRecord?->exports ?? 0);

                return [
                    'client_id' => $clientId,
                    'client_name' => $importRecord?->client_name ?? $exportRecord?->client_name,
                    'client_type' => $importRecord?->client_type ?? $exportRecord?->client_type,
                    'imports' => $imports,
                    'exports' => $exports,
                    'total' => $imports + $exports,
                ];
            })
            ->sortByDesc('total')
            ->values()
            ->all();

        return ['clients' => $clients];
    }

    private function turnaround(User $encoder, int $year, ?int $month = null): array
    {
        [$start, $end] = $this->periodBounds($year, $month);

        $importStagesTable = (new ImportStage)->getTable();
        $exportStagesTable = (new ExportStage)->getTable();

        $importQuery = $this->reportableAssignedImports($encoder, 'import_transactions')
            ->leftJoin($importStagesTable, "{$importStagesTable}.import_transaction_id", '=', 'import_transactions.id')
            ->where('import_transactions.status', ImportStatus::Completed->value)
            ->where('import_transactions.created_at', '>=', $start)
            ->where('import_transactions.created_at', '<', $end);

        $exportQuery = $this->reportableAssignedExports($encoder, 'export_transactions')
            ->leftJoin($exportStagesTable, "{$exportStagesTable}.export_transaction_id", '=', 'export_transactions.id')
            ->where('export_transactions.status', ExportStatus::Completed->value)
            ->where('export_transactions.created_at', '>=', $start)
            ->where('export_transactions.created_at', '<', $end);

        return [
            'imports' => $this->turnaroundStatsFor(
                $importQuery,
                'import_transactions.created_at',
                "COALESCE({$importStagesTable}.billing_completed_at, import_transactions.updated_at)"
            ),
            'exports' => $this->turnaroundStatsFor(
                $exportQuery,
                'export_transactions.created_at',
                "COALESCE({$exportStagesTable}.billing_completed_at, export_transactions.updated_at)"
            ),
        ];
    }

    private function completedTransactionStats(User $encoder, CarbonImmutable $start, CarbonImmutable $end): array
    {
        $importStagesTable = (new ImportStage)->getTable();
        $exportStagesTable = (new ExportStage)->getTable();

        $imports = $this->reportableAssignedImports($encoder, 'import_transactions')
            ->leftJoin($importStagesTable, "{$importStagesTable}.import_transaction_id", '=', 'import_transactions.id')
            ->where('import_transactions.status', ImportStatus::Completed->value)
            ->where(function (Builder $query) use ($start, $end, $importStagesTable): void {
                $query
                    ->where(function (Builder $completedAtQuery) use ($start, $end, $importStagesTable): void {
                        $completedAtQuery
                            ->where("{$importStagesTable}.billing_completed_at", '>=', $start)
                            ->where("{$importStagesTable}.billing_completed_at", '<', $end);
                    })
                    ->orWhere(function (Builder $updatedAtQuery) use ($start, $end, $importStagesTable): void {
                        $updatedAtQuery
                            ->whereNull("{$importStagesTable}.billing_completed_at")
                            ->where('import_transactions.updated_at', '>=', $start)
                            ->where('import_transactions.updated_at', '<', $end);
                    });
            })
            ->count('import_transactions.id');

        $exports = $this->reportableAssignedExports($encoder, 'export_transactions')
            ->leftJoin($exportStagesTable, "{$exportStagesTable}.export_transaction_id", '=', 'export_transactions.id')
            ->where('export_transactions.status', ExportStatus::Completed->value)
            ->where(function (Builder $query) use ($start, $end, $exportStagesTable): void {
                $query
                    ->where(function (Builder $completedAtQuery) use ($start, $end, $exportStagesTable): void {
                        $completedAtQuery
                            ->where("{$exportStagesTable}.billing_completed_at", '>=', $start)
                            ->where("{$exportStagesTable}.billing_completed_at", '<', $end);
                    })
                    ->orWhere(function (Builder $updatedAtQuery) use ($start, $end, $exportStagesTable): void {
                        $updatedAtQuery
                            ->whereNull("{$exportStagesTable}.billing_completed_at")
                            ->where('export_transactions.updated_at', '>=', $start)
                            ->where('export_transactions.updated_at', '<', $end);
                    });
            })
            ->count('export_transactions.id');

        return [
            'imports' => $imports,
            'exports' => $exports,
            'total' => $imports + $exports,
        ];
    }

    private function documentUploadStats(User $encoder, CarbonImmutable $start, CarbonImmutable $end): array
    {
        $documents = Document::query()
            ->where('uploaded_by', $encoder->id)
            ->where('created_at', '>=', $start)
            ->where('created_at', '<', $end)
            ->whereIn('documentable_type', [ImportTransaction::class, ExportTransaction::class])
            ->get(['documentable_type', 'type']);

        return [
            'total' => $documents->count(),
            'imports' => $documents->where('documentable_type', ImportTransaction::class)->count(),
            'exports' => $documents->where('documentable_type', ExportTransaction::class)->count(),
            'by_type' => $documents
                ->groupBy('type')
                ->map(fn (Collection $records, string $type): array => [
                    'key' => $type,
                    'label' => Document::getTypeLabels()[$type] ?? str($type)->headline()->value(),
                    'count' => $records->count(),
                ])
                ->sortByDesc('count')
                ->values()
                ->all(),
        ];
    }

    private function stageCompletionStats(User $encoder, CarbonImmutable $start, CarbonImmutable $end): array
    {
        $imports = $this->stageStatsFor(ImportStage::query(), $this->importStageLabels(), $encoder, $start, $end);
        $exports = $this->stageStatsFor(ExportStage::query(), $this->exportStageLabels(), $encoder, $start, $end);

        return [
            'total' => $imports['total'] + $exports['total'],
            'imports' => $imports,
            'exports' => $exports,
        ];
    }

    private function finalizedRecordStats(User $encoder, CarbonImmutable $start, CarbonImmutable $end): array
    {
        $imports = ImportStage::query()
            ->where('billing_completed_by', $encoder->id)
            ->where('billing_completed_at', '>=', $start)
            ->where('billing_completed_at', '<', $end)
            ->count();

        $exports = ExportStage::query()
            ->where('billing_completed_by', $encoder->id)
            ->where('billing_completed_at', '>=', $start)
            ->where('billing_completed_at', '<', $end)
            ->count();

        return [
            'imports' => $imports,
            'exports' => $exports,
            'total' => $imports + $exports,
        ];
    }

    private function statusBreakdown(User $encoder): array
    {
        $importRow = $this->aggregateAssignedStatusBreakdown(
            ImportTransaction::query(),
            $encoder,
            [ImportStatus::Pending->value],
            [ImportStatus::VesselArrived->value, ImportStatus::Processing->value],
            [ImportStatus::Completed->value],
            [ImportStatus::Cancelled->value],
        );
        $exportRow = $this->aggregateAssignedStatusBreakdown(
            ExportTransaction::query(),
            $encoder,
            [ExportStatus::Pending->value],
            [ExportStatus::InTransit->value, ExportStatus::Departure->value, ExportStatus::Processing->value],
            [ExportStatus::Completed->value],
            [ExportStatus::Cancelled->value],
        );

        return [
            [
                'key' => 'pending',
                'label' => 'Pending',
                'value' => (int) ($importRow->pending_count ?? 0) + (int) ($exportRow->pending_count ?? 0),
            ],
            [
                'key' => 'in_progress',
                'label' => 'In Progress',
                'value' => (int) ($importRow->in_progress_count ?? 0) + (int) ($exportRow->in_progress_count ?? 0),
            ],
            [
                'key' => 'completed',
                'label' => 'Completed',
                'value' => (int) ($importRow->completed_count ?? 0) + (int) ($exportRow->completed_count ?? 0),
            ],
            [
                'key' => 'cancelled',
                'label' => 'Cancelled',
                'value' => (int) ($importRow->cancelled_count ?? 0) + (int) ($exportRow->cancelled_count ?? 0),
            ],
        ];
    }

    private function overdueTransactions(User $encoder): array
    {
        $imports = $this->overdueStats($this->assignedActiveImports($encoder));
        $exports = $this->overdueStats($this->assignedActiveExports($encoder));

        return [
            'threshold_hours' => self::NEEDS_UPDATE_AFTER_HOURS,
            'total' => $imports['overdue_count'] + $exports['overdue_count'],
            'imports' => $imports,
            'exports' => $exports,
        ];
    }

    private function staleActiveImports(User $encoder): Collection
    {
        $needsUpdateThreshold = CarbonImmutable::now()->subHours(self::NEEDS_UPDATE_AFTER_HOURS);

        return $this->assignedActiveImports($encoder)
            ->where('updated_at', '<=', $needsUpdateThreshold)
            ->latest('updated_at')
            ->limit(4)
            ->get()
            ->map(fn (ImportTransaction $transaction): array => [
                'id' => 'needs-update-import-'.$transaction->id,
                'ref' => $this->importReference($transaction),
                'type' => 'import',
                'status' => 'needs_update',
                'title' => 'Import record needs an update',
                'detail' => 'Current status: '.$transaction->status->value.'. Update the record or upload the next required document.',
                'age' => $this->shortAge($transaction->updated_at),
                'destination' => 'imports',
                'sort_at' => $transaction->updated_at?->getTimestamp() ?? 0,
            ]);
    }

    private function staleActiveExports(User $encoder): Collection
    {
        $needsUpdateThreshold = CarbonImmutable::now()->subHours(self::NEEDS_UPDATE_AFTER_HOURS);

        return $this->assignedActiveExports($encoder)
            ->where('updated_at', '<=', $needsUpdateThreshold)
            ->latest('updated_at')
            ->limit(4)
            ->get()
            ->map(fn (ExportTransaction $transaction): array => [
                'id' => 'needs-update-export-'.$transaction->id,
                'ref' => $this->exportReference($transaction),
                'type' => 'export',
                'status' => 'needs_update',
                'title' => 'Export record needs an update',
                'detail' => 'Current status: '.$transaction->status->value.'. Update the record or upload the next required document.',
                'age' => $this->shortAge($transaction->updated_at),
                'destination' => 'exports',
                'sort_at' => $transaction->updated_at?->getTimestamp() ?? 0,
            ]);
    }

    private function openRemarkItems(User $encoder): Collection
    {
        return TransactionRemark::query()
            ->where('is_resolved', false)
            ->whereHasMorph('remarkble', [
                ImportTransaction::class,
                ExportTransaction::class,
            ], function (Builder $query) use ($encoder): void {
                $query
                    ->where('assigned_user_id', $encoder->id)
                    ->where('is_archive', false);
            })
            ->with('remarkble')
            ->latest('created_at')
            ->limit(4)
            ->get()
            ->map(function (TransactionRemark $remark): array {
                $transaction = $remark->remarkble;

                return [
                    'id' => 'remark-'.$remark->id,
                    'ref' => $this->transactionReference($transaction),
                    'type' => $transaction instanceof ImportTransaction ? 'import' : 'export',
                    'status' => 'remark',
                    'title' => 'Open remark needs resolution',
                    'detail' => $remark->message,
                    'age' => $this->shortAge($remark->created_at),
                    'destination' => 'documents',
                    'sort_at' => $remark->created_at?->getTimestamp() ?? 0,
                ];
            });
    }

    private function missingDocumentImports(User $encoder): Collection
    {
        return $this->missingDocumentQuery(
            ImportTransaction::query()
                ->where('assigned_user_id', $encoder->id)
                ->where('is_archive', false)
                ->whereIn('status', $this->terminalImportStatuses()),
            $this->requiredDocumentTypes('import'),
        )
            ->whereDoesntHave('remarks', fn (Builder $query) => $query->where('is_resolved', false))
            ->latest('updated_at')
            ->limit(4)
            ->get()
            ->map(fn (ImportTransaction $transaction): array => [
                'id' => 'missing-import-'.$transaction->id,
                'ref' => $this->importReference($transaction),
                'type' => 'import',
                'status' => 'missing',
                'title' => 'Completed import is missing archive documents',
                'detail' => 'Review the completed import and upload any required final documents.',
                'age' => $this->shortAge($transaction->updated_at),
                'destination' => 'documents',
                'sort_at' => $transaction->updated_at?->getTimestamp() ?? 0,
            ]);
    }

    private function missingDocumentExports(User $encoder): Collection
    {
        return $this->missingDocumentQuery(
            ExportTransaction::query()
                ->where('assigned_user_id', $encoder->id)
                ->where('is_archive', false)
                ->whereIn('status', $this->terminalExportStatuses()),
            $this->requiredDocumentTypes('export'),
        )
            ->whereDoesntHave('remarks', fn (Builder $query) => $query->where('is_resolved', false))
            ->latest('updated_at')
            ->limit(4)
            ->get()
            ->map(fn (ExportTransaction $transaction): array => [
                'id' => 'missing-export-'.$transaction->id,
                'ref' => $this->exportReference($transaction),
                'type' => 'export',
                'status' => 'missing',
                'title' => 'Completed export is missing archive documents',
                'detail' => 'Review the completed export and upload any required final documents.',
                'age' => $this->shortAge($transaction->updated_at),
                'destination' => 'documents',
                'sort_at' => $transaction->updated_at?->getTimestamp() ?? 0,
            ]);
    }

    private function countUpcomingImportArrivals(User $encoder): int
    {
        return $this->assignedActiveImports($encoder)
            ->whereBetween('arrival_date', [
                CarbonImmutable::now()->startOfDay(),
                CarbonImmutable::now()->addDays(7)->endOfDay(),
            ])
            ->count();
    }

    private function countUpcomingExportDepartures(User $encoder): int
    {
        return $this->assignedActiveExports($encoder)
            ->whereBetween('export_date', [
                CarbonImmutable::now()->startOfDay(),
                CarbonImmutable::now()->addDays(7)->endOfDay(),
            ])
            ->count();
    }

    private function countOpenRemarks(User $encoder): int
    {
        return TransactionRemark::query()
            ->where('is_resolved', false)
            ->whereHasMorph('remarkble', [
                ImportTransaction::class,
                ExportTransaction::class,
            ], function (Builder $query) use ($encoder): void {
                $query
                    ->where('assigned_user_id', $encoder->id)
                    ->where('is_archive', false);
            })
            ->count();
    }

    private function countMissingRequiredDocuments(Builder $query, array $requiredTypes): int
    {
        return $this->missingDocumentQuery($query, $requiredTypes)->count();
    }

    private function monthlyCounts(Builder $query): Collection
    {
        $driver = DB::connection()->getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            return (clone $query)
                ->selectRaw('MONTH(created_at) as month, COUNT(*) as count')
                ->groupByRaw('MONTH(created_at)')
                ->pluck('count', 'month');
        }

        if ($driver === 'sqlite') {
            return (clone $query)
                ->selectRaw("CAST(strftime('%m', created_at) AS INTEGER) as month, COUNT(*) as count")
                ->groupByRaw("strftime('%m', created_at)")
                ->pluck('count', 'month');
        }

        return (clone $query)
            ->get(['created_at'])
            ->groupBy(fn (Model $record) => $record->created_at?->month)
            ->map(fn (Collection $records): int => $records->count());
    }

    private function turnaroundStatsFor(Builder $query, string $createdAtColumn, string $completedAtExpression): array
    {
        $driver = DB::connection()->getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            $dayDifference = "DATEDIFF($completedAtExpression, $createdAtColumn)";
            $stats = (clone $query)->selectRaw("
                COUNT(*) as completed_count,
                ROUND(AVG($dayDifference), 1) as avg_days,
                MIN($dayDifference) as min_days,
                MAX($dayDifference) as max_days
            ")->first();

            return $this->formatTurnaroundStats($stats);
        }

        if ($driver === 'sqlite') {
            $dayDifference = "julianday(date($completedAtExpression)) - julianday(date($createdAtColumn))";
            $stats = (clone $query)->selectRaw("
                COUNT(*) as completed_count,
                ROUND(AVG($dayDifference), 1) as avg_days,
                MIN(CAST($dayDifference AS INTEGER)) as min_days,
                MAX(CAST($dayDifference AS INTEGER)) as max_days
            ")->first();

            return $this->formatTurnaroundStats($stats);
        }

        $durations = (clone $query)
            ->selectRaw($createdAtColumn.' as created_at, '.$completedAtExpression.' as completed_at')
            ->get()
            ->map(function (Model $record): ?int {
                if ($record->completed_at === null || $record->created_at === null) {
                    return null;
                }

                return (int) CarbonImmutable::parse($record->completed_at)
                    ->diffInDays(CarbonImmutable::parse($record->created_at));
            })
            ->filter(fn (?int $value): bool => $value !== null)
            ->values();

        if ($durations->isEmpty()) {
            return [
                'completed_count' => 0,
                'avg_days' => null,
                'min_days' => null,
                'max_days' => null,
            ];
        }

        return [
            'completed_count' => $durations->count(),
            'avg_days' => round($durations->avg(), 1),
            'min_days' => $durations->min(),
            'max_days' => $durations->max(),
        ];
    }

    private function formatTurnaroundStats(?object $stats): array
    {
        return [
            'completed_count' => (int) ($stats->completed_count ?? 0),
            'avg_days' => $stats?->avg_days !== null ? (float) $stats->avg_days : null,
            'min_days' => $stats?->min_days !== null ? (int) $stats->min_days : null,
            'max_days' => $stats?->max_days !== null ? (int) $stats->max_days : null,
        ];
    }

    private function stageStatsFor(Builder $query, array $stageLabels, User $encoder, CarbonImmutable $start, CarbonImmutable $end): array
    {
        $selects = [];
        $bindings = [];

        foreach (array_keys($stageLabels) as $stageKey) {
            $selects[] = "COUNT(CASE WHEN {$stageKey}_completed_by = ? AND {$stageKey}_completed_at >= ? AND {$stageKey}_completed_at < ? THEN 1 END) as {$stageKey}_count";
            $bindings[] = $encoder->id;
            $bindings[] = $start;
            $bindings[] = $end;
        }

        $stageCounts = $query
            ->toBase()
            ->selectRaw(implode(', ', $selects), $bindings)
            ->first();

        $stages = collect($stageLabels)
            ->map(function (string $label, string $stageKey) use ($stageCounts): array {
                return [
                    'key' => $stageKey,
                    'label' => $label,
                    'count' => (int) ($stageCounts?->{"{$stageKey}_count"} ?? 0),
                ];
            })
            ->values();

        return [
            'total' => $stages->sum('count'),
            'stages' => $stages->all(),
        ];
    }

    private function assignedStatusCount(User $encoder, array $importStatuses, array $exportStatuses): int
    {
        return ImportTransaction::query()
            ->where('assigned_user_id', $encoder->id)
            ->where('is_archive', false)
            ->whereIn('status', $importStatuses)
            ->count()
            + ExportTransaction::query()
                ->where('assigned_user_id', $encoder->id)
                ->where('is_archive', false)
                ->whereIn('status', $exportStatuses)
                ->count();
    }

    /**
     * @param  list<string>  $activeStatuses
     */
    private function aggregateAssignedTransactionKpis(
        Builder $query,
        User $encoder,
        array $activeStatuses,
        string $dateColumn,
        CarbonImmutable $needsUpdateThreshold,
        CarbonImmutable $upcomingStart,
        CarbonImmutable $upcomingEnd,
    ): ?object {
        $placeholders = implode(', ', array_fill(0, count($activeStatuses), '?'));

        return $query
            ->toBase()
            ->where('assigned_user_id', $encoder->id)
            ->where('is_archive', false)
            ->selectRaw(
                "COUNT(CASE WHEN status IN ({$placeholders}) THEN 1 END) as active_count, ".
                "COUNT(CASE WHEN status IN ({$placeholders}) AND updated_at <= ? THEN 1 END) as delayed_count, ".
                "COUNT(CASE WHEN status IN ({$placeholders}) AND {$dateColumn} BETWEEN ? AND ? THEN 1 END) as upcoming_count",
                array_merge(
                    $activeStatuses,
                    $activeStatuses,
                    [$needsUpdateThreshold],
                    $activeStatuses,
                    [$upcomingStart, $upcomingEnd],
                ),
            )
            ->first();
    }

    /**
     * @param  list<string>  $pendingStatuses
     * @param  list<string>  $inProgressStatuses
     * @param  list<string>  $completedStatuses
     * @param  list<string>  $cancelledStatuses
     */
    private function aggregateAssignedStatusBreakdown(
        Builder $query,
        User $encoder,
        array $pendingStatuses,
        array $inProgressStatuses,
        array $completedStatuses,
        array $cancelledStatuses,
    ): ?object {
        $pendingPlaceholders = implode(', ', array_fill(0, count($pendingStatuses), '?'));
        $inProgressPlaceholders = implode(', ', array_fill(0, count($inProgressStatuses), '?'));
        $completedPlaceholders = implode(', ', array_fill(0, count($completedStatuses), '?'));
        $cancelledPlaceholders = implode(', ', array_fill(0, count($cancelledStatuses), '?'));

        return $query
            ->toBase()
            ->where('assigned_user_id', $encoder->id)
            ->where('is_archive', false)
            ->selectRaw(
                "COUNT(CASE WHEN status IN ({$pendingPlaceholders}) THEN 1 END) as pending_count, ".
                "COUNT(CASE WHEN status IN ({$inProgressPlaceholders}) THEN 1 END) as in_progress_count, ".
                "COUNT(CASE WHEN status IN ({$completedPlaceholders}) THEN 1 END) as completed_count, ".
                "COUNT(CASE WHEN status IN ({$cancelledPlaceholders}) THEN 1 END) as cancelled_count",
                array_merge(
                    $pendingStatuses,
                    $inProgressStatuses,
                    $completedStatuses,
                    $cancelledStatuses,
                ),
            )
            ->first();
    }

    private function overdueStats(Builder $query): array
    {
        $threshold = CarbonImmutable::now()->subHours(self::NEEDS_UPDATE_AFTER_HOURS);

        $ages = (clone $query)
            ->where('updated_at', '<=', $threshold)
            ->pluck('updated_at')
            ->map(fn (mixed $updatedAt): int => (int) CarbonImmutable::parse($updatedAt)->diffInHours(CarbonImmutable::now()))
            ->values();

        return [
            'overdue_count' => $ages->count(),
            'stale_48_72_count' => $ages
                ->filter(fn (int $hours): bool => $hours >= self::NEEDS_UPDATE_AFTER_HOURS && $hours < 72)
                ->count(),
            'stale_over_72_count' => $ages
                ->filter(fn (int $hours): bool => $hours >= 72)
                ->count(),
            'oldest_hours' => $ages->isEmpty() ? null : $ages->max(),
        ];
    }

    private function reportableAssignedImports(User $encoder, string $table = 'import_transactions'): Builder
    {
        return $this->reportableTransactions(ImportTransaction::query(), $table)
            ->where("{$table}.assigned_user_id", $encoder->id);
    }

    private function reportableAssignedExports(User $encoder, string $table = 'export_transactions'): Builder
    {
        return $this->reportableTransactions(ExportTransaction::query(), $table)
            ->where("{$table}.assigned_user_id", $encoder->id);
    }

    private function reportableTransactions(Builder $query, string $table): Builder
    {
        return $query->where(function (Builder $archiveQuery) use ($table): void {
            $archiveQuery
                ->where("{$table}.is_archive", false)
                ->orWhere("{$table}.archive_origin", ArchiveOrigin::ArchivedFromLive->value);
        });
    }

    private function periodBounds(int $year, ?int $month = null): array
    {
        $start = CarbonImmutable::create($year, $month ?? 1, 1, 0, 0, 0);

        if ($month === null) {
            return [$start, $start->addYear()];
        }

        return [$start, $start->addMonth()];
    }

    private function importStageLabels(): array
    {
        return [
            'boc' => 'BOC Document Processing',
            'bonds' => 'BONDS',
            'do' => 'Delivery Order Request',
            'ppa' => 'Payment for PPA Charges',
            'port_charges' => 'Payment for Port Charges',
            'releasing' => 'Releasing of Documents',
            'billing' => 'Billing and Liquidation',
        ];
    }

    private function exportStageLabels(): array
    {
        return [
            'docs_prep' => 'Documents Preparation',
            'co' => 'CO Application',
            'phytosanitary' => 'Phytosanitary Certificates',
            'cil' => 'CIL',
            'dccci' => 'DCCCI Printing',
            'bl' => 'Bill of Lading',
            'billing' => 'Billing and Liquidation',
        ];
    }

    private function missingDocumentQuery(Builder $query, array $requiredTypes): Builder
    {
        return $query->where(function (Builder $missingQuery) use ($requiredTypes): void {
            foreach ($requiredTypes as $typeKey) {
                $missingQuery->orWhereDoesntHave('documents', function (Builder $documentQuery) use ($typeKey): void {
                    $documentQuery->where('type', $typeKey);
                });
            }
        });
    }

    private function assignedActiveImports(User $encoder): Builder
    {
        return ImportTransaction::query()
            ->where('assigned_user_id', $encoder->id)
            ->where('is_archive', false)
            ->whereIn('status', $this->activeImportStatuses());
    }

    private function assignedActiveExports(User $encoder): Builder
    {
        return ExportTransaction::query()
            ->where('assigned_user_id', $encoder->id)
            ->where('is_archive', false)
            ->whereIn('status', $this->activeExportStatuses());
    }

    private function requiredDocumentTypes(string $type): array
    {
        $typeKeys = $type === 'import'
            ? Document::importTypeKeys()
            : Document::exportTypeKeys();

        return array_values(array_filter($typeKeys, fn (string $typeKey): bool => $typeKey !== 'others'));
    }

    private function activeImportStatuses(): array
    {
        return [
            ImportStatus::Pending->value,
            ImportStatus::VesselArrived->value,
            ImportStatus::Processing->value,
        ];
    }

    private function activeExportStatuses(): array
    {
        return [
            ExportStatus::Pending->value,
            ExportStatus::InTransit->value,
            ExportStatus::Departure->value,
            ExportStatus::Processing->value,
        ];
    }

    private function terminalImportStatuses(): array
    {
        return [
            ImportStatus::Completed->value,
            ImportStatus::Cancelled->value,
        ];
    }

    private function terminalExportStatuses(): array
    {
        return [
            ExportStatus::Completed->value,
            ExportStatus::Cancelled->value,
        ];
    }

    private function transactionReference(?Model $transaction): string
    {
        if ($transaction instanceof ImportTransaction) {
            return $this->importReference($transaction);
        }

        if ($transaction instanceof ExportTransaction) {
            return $this->exportReference($transaction);
        }

        return 'Transaction';
    }

    private function importReference(ImportTransaction $transaction): string
    {
        return $transaction->customs_ref_no ?: 'IMP-'.str_pad((string) $transaction->id, 4, '0', STR_PAD_LEFT);
    }

    private function exportReference(ExportTransaction $transaction): string
    {
        return $transaction->bl_no ?: 'Export #'.$transaction->id;
    }

    private function shortAge(null|CarbonInterface|string $timestamp): string
    {
        if (! $timestamp instanceof CarbonInterface) {
            return '—';
        }

        $minutes = (int) floor($timestamp->diffInMinutes(CarbonImmutable::now()));

        if ($minutes < 1) {
            return 'just now';
        }

        if ($minutes < 60) {
            return $minutes.'m ago';
        }

        $hours = (int) floor($timestamp->diffInHours(CarbonImmutable::now()));
        if ($hours < 24) {
            return $hours.'h ago';
        }

        $days = (int) floor($timestamp->diffInDays(CarbonImmutable::now()));
        if ($days < 7) {
            return $days.'d ago';
        }

        $weeks = intdiv($days, 7);

        return $weeks.'w ago';
    }
}
