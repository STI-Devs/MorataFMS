<?php

namespace App\Queries\Dashboard;

use App\Enums\ArchiveOrigin;
use App\Enums\AuditEvent;
use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;
use App\Queries\AdminDocumentReview\AdminDocumentReviewStatsQuery;
use App\Queries\Reports\MonthlyReportQuery;
use App\Support\AdminDocumentReview\AdminDocumentReviewData;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class AdminDashboardShowQuery
{
    private const DELAYED_AFTER_HOURS = 48;

    private const CRITICAL_ITEMS_LIMIT = 5;

    private const ACTIVITY_FEED_LIMIT = 5;

    public function __construct(
        private AdminDocumentReviewStatsQuery $adminDocumentReviewStatsQuery,
        private MonthlyReportQuery $monthlyReportQuery,
        private AdminDocumentReviewData $reviewData,
    ) {}

    public function handle(): array
    {
        return [
            'kpis' => $this->kpis(),
            'critical_operations' => $this->criticalOperations(),
            'action_feed' => $this->actionFeed(),
            'workloads' => $this->workloads(),
            'records_summary' => $this->recordsSummary(),
            'analytics' => $this->analytics(),
        ];
    }

    private function recordsSummary(): array
    {
        return $this->adminDocumentReviewStatsQuery->handle();
    }

    private function analytics(): array
    {
        $currentDate = CarbonImmutable::now();
        $year = $currentDate->year;

        $monthlyVolume = $this->monthlyReportQuery->handle($year);

        return [
            'year' => $year,
            'monthly_volume' => [
                'year' => $year,
                ...$monthlyVolume,
            ],
            'transaction_flow' => $this->transactionFlow($monthlyVolume, $year),
            'status_breakdown' => $this->statusBreakdown(),
            'overdue_transactions' => $this->overdueTransactions(),
        ];
    }

    private function kpis(): array
    {
        $delayedThreshold = CarbonImmutable::now()->subHours(self::DELAYED_AFTER_HOURS);
        $upcomingStart = CarbonImmutable::now()->startOfDay();
        $upcomingEnd = CarbonImmutable::now()->addDays(7)->endOfDay();
        $importKpiRow = $this->importKpiRow($delayedThreshold, $upcomingStart, $upcomingEnd);
        $exportKpiRow = $this->exportKpiRow($delayedThreshold, $upcomingStart, $upcomingEnd);

        return [
            'active_imports' => (int) ($importKpiRow->active_count ?? 0),
            'active_exports' => (int) ($exportKpiRow->active_count ?? 0),
            'delayed_shipments' => (int) ($importKpiRow->delayed_count ?? 0) + (int) ($exportKpiRow->delayed_count ?? 0),
            'upcoming_eta_etd' => (int) ($importKpiRow->upcoming_count ?? 0) + (int) ($exportKpiRow->upcoming_count ?? 0),
            'open_remarks' => $this->countOpenRemarks(),
            'missing_final_docs' => $this->reviewData->countMissingRequiredDocuments(
                ImportTransaction::query()
                    ->where('is_archive', false)
                    ->whereIn('status', $this->terminalImportStatuses()),
                'import',
            ) + $this->reviewData->countMissingRequiredDocuments(
                ExportTransaction::query()
                    ->where('is_archive', false)
                    ->whereIn('status', $this->terminalExportStatuses()),
                'export',
            ),
        ];
    }

    private function criticalOperations(): array
    {
        return collect()
            ->merge($this->staleActiveImports())
            ->merge($this->staleActiveExports())
            ->merge($this->missingDocumentImports())
            ->merge($this->missingDocumentExports())
            ->merge($this->flaggedImports())
            ->merge($this->flaggedExports())
            ->sortByDesc('sort_at')
            ->take(self::CRITICAL_ITEMS_LIMIT)
            ->values()
            ->map(fn (array $item): array => collect($item)->except('sort_at')->all())
            ->all();
    }

    private function actionFeed(): array
    {
        $auditItems = AuditLog::query()
            ->with(['user:id,name', 'auditable'])
            ->whereIn('event', [
                AuditEvent::EncoderReassigned->value,
                AuditEvent::StatusChanged->value,
            ])
            ->latest('created_at')
            ->limit(self::ACTIVITY_FEED_LIMIT)
            ->get()
            ->map(function (AuditLog $log): array {
                $target = $this->transactionReferenceFromModel($log->auditable_type, $log->auditable);

                return [
                    'id' => 'audit-'.$log->id,
                    'age' => $this->shortAge($log->created_at),
                    'actor' => $log->user?->name ?? 'System',
                    'action' => match ($log->event) {
                        AuditEvent::EncoderReassigned->value => 'Encoder Reassigned',
                        AuditEvent::StatusChanged->value => 'Status Override',
                        default => 'Admin Action',
                    },
                    'target' => $target,
                    'detail' => data_get($log->new_values, 'description', 'Recent admin activity recorded.'),
                    'created_at' => $log->created_at?->toIso8601String(),
                    'sort_at' => $log->created_at?->getTimestamp() ?? 0,
                ];
            });

        $remarkItems = TransactionRemark::query()
            ->where('is_resolved', false)
            ->with(['author:id,name', 'remarkble'])
            ->latest('created_at')
            ->limit(self::ACTIVITY_FEED_LIMIT)
            ->get()
            ->map(function (TransactionRemark $remark): array {
                $target = $this->transactionReferenceFromModel($remark->remarkble_type, $remark->remarkble);

                return [
                    'id' => 'remark-'.$remark->id,
                    'age' => $this->shortAge($remark->created_at),
                    'actor' => $remark->author?->name ?? 'System',
                    'action' => 'Document Alert',
                    'target' => $target,
                    'detail' => $remark->message,
                    'created_at' => $remark->created_at?->toIso8601String(),
                    'sort_at' => $remark->created_at?->getTimestamp() ?? 0,
                ];
            });

        return collect()
            ->merge($auditItems)
            ->merge($remarkItems)
            ->sortByDesc('sort_at')
            ->take(self::ACTIVITY_FEED_LIMIT)
            ->values()
            ->map(fn (array $item): array => collect($item)->except('sort_at')->all())
            ->all();
    }

    private function workloads(): array
    {
        $delayedThreshold = CarbonImmutable::now()->subHours(self::DELAYED_AFTER_HOURS);

        $activeImportCounts = ImportTransaction::query()
            ->selectRaw('assigned_user_id, count(*) as aggregate')
            ->where('is_archive', false)
            ->whereNotNull('assigned_user_id')
            ->whereIn('status', $this->activeImportStatuses())
            ->groupBy('assigned_user_id')
            ->pluck('aggregate', 'assigned_user_id');

        $activeExportCounts = ExportTransaction::query()
            ->selectRaw('assigned_user_id, count(*) as aggregate')
            ->where('is_archive', false)
            ->whereNotNull('assigned_user_id')
            ->whereIn('status', $this->activeExportStatuses())
            ->groupBy('assigned_user_id')
            ->pluck('aggregate', 'assigned_user_id');

        $overdueImportCounts = ImportTransaction::query()
            ->selectRaw('assigned_user_id, count(*) as aggregate')
            ->where('is_archive', false)
            ->whereNotNull('assigned_user_id')
            ->whereIn('status', $this->activeImportStatuses())
            ->where('updated_at', '<=', $delayedThreshold)
            ->groupBy('assigned_user_id')
            ->pluck('aggregate', 'assigned_user_id');

        $overdueExportCounts = ExportTransaction::query()
            ->selectRaw('assigned_user_id, count(*) as aggregate')
            ->where('is_archive', false)
            ->whereNotNull('assigned_user_id')
            ->whereIn('status', $this->activeExportStatuses())
            ->where('updated_at', '<=', $delayedThreshold)
            ->groupBy('assigned_user_id')
            ->pluck('aggregate', 'assigned_user_id');

        return User::query()
            ->where('role', UserRole::Encoder->value)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'job_title', 'role'])
            ->map(function (User $user) use (
                $activeImportCounts,
                $activeExportCounts,
                $overdueImportCounts,
                $overdueExportCounts,
            ): array {
                $active = (int) ($activeImportCounts[$user->id] ?? 0) + (int) ($activeExportCounts[$user->id] ?? 0);
                $overdue = (int) ($overdueImportCounts[$user->id] ?? 0) + (int) ($overdueExportCounts[$user->id] ?? 0);

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->job_title ?: $user->role->label(),
                    'active' => $active,
                    'overdue' => $overdue,
                ];
            })
            ->sortByDesc(fn (array $workload): int => ($workload['active'] * 1000) + $workload['overdue'])
            ->values()
            ->all();
    }

    private function transactionFlow(array $monthlyVolume, int $year): array
    {
        $imports = (int) ($monthlyVolume['total_imports'] ?? 0);
        $exports = (int) ($monthlyVolume['total_exports'] ?? 0);
        $total = (int) ($monthlyVolume['total'] ?? 0);
        $completed = $this->completedTransactionsCountForYear($year);

        return [
            'imports' => $imports,
            'exports' => $exports,
            'total' => $total,
            'completed' => $completed,
            'completion_rate' => $total > 0
                ? (int) round(($completed / $total) * 100)
                : 0,
        ];
    }

    private function statusBreakdown(): array
    {
        $importRow = ImportTransaction::query()
            ->toBase()
            ->where('is_archive', false)
            ->selectRaw(
                'COUNT(CASE WHEN status = ? THEN 1 END) as pending, '.
                'COUNT(CASE WHEN status IN (?, ?) THEN 1 END) as in_progress, '.
                'COUNT(CASE WHEN status = ? THEN 1 END) as completed, '.
                'COUNT(CASE WHEN status = ? THEN 1 END) as cancelled',
                [
                    ImportStatus::Pending->value,
                    ImportStatus::VesselArrived->value,
                    ImportStatus::Processing->value,
                    ImportStatus::Completed->value,
                    ImportStatus::Cancelled->value,
                ],
            )
            ->first();

        $exportRow = ExportTransaction::query()
            ->toBase()
            ->where('is_archive', false)
            ->selectRaw(
                'COUNT(CASE WHEN status = ? THEN 1 END) as pending, '.
                'COUNT(CASE WHEN status IN (?, ?, ?) THEN 1 END) as in_progress, '.
                'COUNT(CASE WHEN status = ? THEN 1 END) as completed, '.
                'COUNT(CASE WHEN status = ? THEN 1 END) as cancelled',
                [
                    ExportStatus::Pending->value,
                    ExportStatus::InTransit->value,
                    ExportStatus::Departure->value,
                    ExportStatus::Processing->value,
                    ExportStatus::Completed->value,
                    ExportStatus::Cancelled->value,
                ],
            )
            ->first();

        $pending = (int) ($importRow->pending ?? 0) + (int) ($exportRow->pending ?? 0);
        $inProgress = (int) ($importRow->in_progress ?? 0) + (int) ($exportRow->in_progress ?? 0);
        $completed = (int) ($importRow->completed ?? 0) + (int) ($exportRow->completed ?? 0);
        $cancelled = (int) ($importRow->cancelled ?? 0) + (int) ($exportRow->cancelled ?? 0);

        return [
            [
                'key' => 'pending',
                'label' => 'Pending',
                'value' => $pending,
            ],
            [
                'key' => 'in_progress',
                'label' => 'In Progress',
                'value' => $inProgress,
            ],
            [
                'key' => 'completed',
                'label' => 'Completed',
                'value' => $completed,
            ],
            [
                'key' => 'cancelled',
                'label' => 'Cancelled',
                'value' => $cancelled,
            ],
        ];
    }

    private function overdueTransactions(): array
    {
        $imports = $this->overdueStats(
            ImportTransaction::query()
                ->where('is_archive', false)
                ->whereIn('status', $this->activeImportStatuses())
        );

        $exports = $this->overdueStats(
            ExportTransaction::query()
                ->where('is_archive', false)
                ->whereIn('status', $this->activeExportStatuses())
        );

        return [
            'threshold_hours' => self::DELAYED_AFTER_HOURS,
            'total' => $imports['overdue_count'] + $exports['overdue_count'],
            'imports' => $imports,
            'exports' => $exports,
        ];
    }

    private function staleActiveImports(): Collection
    {
        $delayedThreshold = CarbonImmutable::now()->subHours(self::DELAYED_AFTER_HOURS);

        return ImportTransaction::query()
            ->where('is_archive', false)
            ->whereIn('status', $this->activeImportStatuses())
            ->where('updated_at', '<=', $delayedThreshold)
            ->with(['assignedUser:id,name'])
            ->latest('updated_at')
            ->limit(3)
            ->get()
            ->map(function (ImportTransaction $transaction): array {
                return [
                    'id' => 'stuck-import-'.$transaction->id,
                    'ref' => $this->importReference($transaction),
                    'status' => 'stuck',
                    'title' => 'Import record needs a staff update',
                    'detail' => $this->staleDetail($transaction->status->value, $transaction->assignedUser?->name),
                    'age' => $this->shortAge($transaction->updated_at),
                    'destination' => 'transactions',
                    'sort_at' => $transaction->updated_at?->getTimestamp() ?? 0,
                ];
            });
    }

    private function staleActiveExports(): Collection
    {
        $delayedThreshold = CarbonImmutable::now()->subHours(self::DELAYED_AFTER_HOURS);

        return ExportTransaction::query()
            ->where('is_archive', false)
            ->whereIn('status', $this->activeExportStatuses())
            ->where('updated_at', '<=', $delayedThreshold)
            ->with(['assignedUser:id,name'])
            ->latest('updated_at')
            ->limit(3)
            ->get()
            ->map(function (ExportTransaction $transaction): array {
                return [
                    'id' => 'stuck-export-'.$transaction->id,
                    'ref' => $this->exportReference($transaction),
                    'status' => 'stuck',
                    'title' => 'Export record needs a staff update',
                    'detail' => $this->staleDetail($transaction->status->value, $transaction->assignedUser?->name),
                    'age' => $this->shortAge($transaction->updated_at),
                    'destination' => 'transactions',
                    'sort_at' => $transaction->updated_at?->getTimestamp() ?? 0,
                ];
            });
    }

    private function missingDocumentImports(): Collection
    {
        return $this->missingDocumentQuery(
            ImportTransaction::query()
                ->where('is_archive', false)
                ->whereIn('status', $this->terminalImportStatuses())
                ->with(['assignedUser:id,name']),
            $this->requiredDocumentTypes('import'),
        )
            ->whereDoesntHave('remarks', fn (Builder $query) => $query->where('is_resolved', false))
            ->latest('updated_at')
            ->limit(3)
            ->get()
            ->map(function (ImportTransaction $transaction): array {
                return [
                    'id' => 'missing-import-'.$transaction->id,
                    'ref' => $this->importReference($transaction),
                    'status' => 'missing',
                    'title' => 'Final import documents are still incomplete',
                    'detail' => $this->terminalDetail(
                        $transaction->status->value,
                        $transaction->assignedUser?->name,
                        'Missing required archive documents.',
                    ),
                    'age' => $this->shortAge($transaction->updated_at),
                    'destination' => 'admin_document_review',
                    'sort_at' => $transaction->updated_at?->getTimestamp() ?? 0,
                ];
            });
    }

    private function missingDocumentExports(): Collection
    {
        return $this->missingDocumentQuery(
            ExportTransaction::query()
                ->where('is_archive', false)
                ->whereIn('status', $this->terminalExportStatuses())
                ->with(['assignedUser:id,name']),
            $this->requiredDocumentTypes('export'),
        )
            ->whereDoesntHave('remarks', fn (Builder $query) => $query->where('is_resolved', false))
            ->latest('updated_at')
            ->limit(3)
            ->get()
            ->map(function (ExportTransaction $transaction): array {
                return [
                    'id' => 'missing-export-'.$transaction->id,
                    'ref' => $this->exportReference($transaction),
                    'status' => 'missing',
                    'title' => 'Final export documents are still incomplete',
                    'detail' => $this->terminalDetail(
                        $transaction->status->value,
                        $transaction->assignedUser?->name,
                        'Missing required archive documents.',
                    ),
                    'age' => $this->shortAge($transaction->updated_at),
                    'destination' => 'admin_document_review',
                    'sort_at' => $transaction->updated_at?->getTimestamp() ?? 0,
                ];
            });
    }

    private function flaggedImports(): Collection
    {
        return ImportTransaction::query()
            ->where('is_archive', false)
            ->whereIn('status', $this->terminalImportStatuses())
            ->whereHas('remarks', fn (Builder $query) => $query->where('is_resolved', false))
            ->with(['assignedUser:id,name'])
            ->latest('updated_at')
            ->limit(3)
            ->get()
            ->map(function (ImportTransaction $transaction): array {
                return [
                    'id' => 'review-import-'.$transaction->id,
                    'ref' => $this->importReference($transaction),
                    'status' => 'review',
                    'title' => 'Flagged import file needs admin review',
                    'detail' => $this->terminalDetail(
                        $transaction->status->value,
                        $transaction->assignedUser?->name,
                        'Unresolved remarks are blocking archive review.',
                    ),
                    'age' => $this->shortAge($transaction->updated_at),
                    'destination' => 'admin_document_review',
                    'sort_at' => $transaction->updated_at?->getTimestamp() ?? 0,
                ];
            });
    }

    private function flaggedExports(): Collection
    {
        return ExportTransaction::query()
            ->where('is_archive', false)
            ->whereIn('status', $this->terminalExportStatuses())
            ->whereHas('remarks', fn (Builder $query) => $query->where('is_resolved', false))
            ->with(['assignedUser:id,name'])
            ->latest('updated_at')
            ->limit(3)
            ->get()
            ->map(function (ExportTransaction $transaction): array {
                return [
                    'id' => 'review-export-'.$transaction->id,
                    'ref' => $this->exportReference($transaction),
                    'status' => 'review',
                    'title' => 'Flagged export file needs admin review',
                    'detail' => $this->terminalDetail(
                        $transaction->status->value,
                        $transaction->assignedUser?->name,
                        'Unresolved remarks are blocking archive review.',
                    ),
                    'age' => $this->shortAge($transaction->updated_at),
                    'destination' => 'admin_document_review',
                    'sort_at' => $transaction->updated_at?->getTimestamp() ?? 0,
                ];
            });
    }

    private function importKpiRow(
        CarbonImmutable $delayedThreshold,
        CarbonImmutable $upcomingStart,
        CarbonImmutable $upcomingEnd,
    ): ?object {
        return $this->aggregateTransactionKpis(
            ImportTransaction::query(),
            $this->activeImportStatuses(),
            'arrival_date',
            $delayedThreshold,
            $upcomingStart,
            $upcomingEnd,
        );
    }

    private function exportKpiRow(
        CarbonImmutable $delayedThreshold,
        CarbonImmutable $upcomingStart,
        CarbonImmutable $upcomingEnd,
    ): ?object {
        return $this->aggregateTransactionKpis(
            ExportTransaction::query(),
            $this->activeExportStatuses(),
            'export_date',
            $delayedThreshold,
            $upcomingStart,
            $upcomingEnd,
        );
    }

    /**
     * @param  list<string>  $activeStatuses
     */
    private function aggregateTransactionKpis(
        Builder $query,
        array $activeStatuses,
        string $dateColumn,
        CarbonImmutable $delayedThreshold,
        CarbonImmutable $upcomingStart,
        CarbonImmutable $upcomingEnd,
    ): ?object {
        $placeholders = implode(', ', array_fill(0, count($activeStatuses), '?'));

        return $query
            ->toBase()
            ->where('is_archive', false)
            ->selectRaw(
                "COUNT(CASE WHEN status IN ({$placeholders}) THEN 1 END) as active_count, ".
                "COUNT(CASE WHEN status IN ({$placeholders}) AND updated_at <= ? THEN 1 END) as delayed_count, ".
                "COUNT(CASE WHEN status IN ({$placeholders}) AND {$dateColumn} BETWEEN ? AND ? THEN 1 END) as upcoming_count",
                array_merge(
                    $activeStatuses,
                    $activeStatuses,
                    [$delayedThreshold],
                    $activeStatuses,
                    [$upcomingStart, $upcomingEnd],
                ),
            )
            ->first();
    }

    private function completedTransactionsCountForYear(int $year): int
    {
        return $this->reportableTransactionsWithinYear(ImportTransaction::query(), $year)
            ->where('status', ImportStatus::Completed->value)
            ->count()
            + $this->reportableTransactionsWithinYear(ExportTransaction::query(), $year)
                ->where('status', ExportStatus::Completed->value)
                ->count();
    }

    private function countUpcomingImportArrivals(): int
    {
        return ImportTransaction::query()
            ->where('is_archive', false)
            ->whereIn('status', $this->activeImportStatuses())
            ->whereBetween('arrival_date', [
                CarbonImmutable::now()->startOfDay(),
                CarbonImmutable::now()->addDays(7)->endOfDay(),
            ])
            ->count();
    }

    private function countUpcomingExportDepartures(): int
    {
        return ExportTransaction::query()
            ->where('is_archive', false)
            ->whereIn('status', $this->activeExportStatuses())
            ->whereBetween('export_date', [
                CarbonImmutable::now()->startOfDay(),
                CarbonImmutable::now()->addDays(7)->endOfDay(),
            ])
            ->count();
    }

    private function countOpenRemarks(): int
    {
        return TransactionRemark::query()
            ->where('is_resolved', false)
            ->whereHasMorph('remarkble', [
                ImportTransaction::class,
                ExportTransaction::class,
            ], function (Builder $query): void {
                $query->where('is_archive', false);
            })
            ->count();
    }

    /**
     * @return array{
     *     overdue_count: int,
     *     stale_48_72_count: int,
     *     stale_over_72_count: int,
     *     oldest_hours: int|null
     * }
     */
    private function overdueStats(Builder $query): array
    {
        $threshold = CarbonImmutable::now()->subHours(self::DELAYED_AFTER_HOURS);

        $ages = (clone $query)
            ->where('updated_at', '<=', $threshold)
            ->pluck('updated_at')
            ->map(function (mixed $updatedAt): int {
                return CarbonImmutable::parse($updatedAt)->diffInHours(CarbonImmutable::now());
            })
            ->values();

        return [
            'overdue_count' => $ages->count(),
            'stale_48_72_count' => $ages
                ->filter(fn (int $hours): bool => $hours >= self::DELAYED_AFTER_HOURS && $hours < 72)
                ->count(),
            'stale_over_72_count' => $ages
                ->filter(fn (int $hours): bool => $hours >= 72)
                ->count(),
            'oldest_hours' => $ages->isEmpty() ? null : $ages->max(),
        ];
    }

    private function reportableTransactionsWithinYear(Builder $query, int $year): Builder
    {
        [$start, $end] = $this->yearBounds($year);

        return $this->reportableTransactions($query)
            ->where('created_at', '>=', $start)
            ->where('created_at', '<', $end);
    }

    private function reportableTransactions(Builder $query): Builder
    {
        return $query->where(function (Builder $archiveQuery): void {
            $archiveQuery
                ->where('is_archive', false)
                ->orWhere('archive_origin', ArchiveOrigin::ArchivedFromLive->value);
        });
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

    private function yearBounds(int $year): array
    {
        $start = CarbonImmutable::create($year, 1, 1, 0, 0, 0);

        return [$start, $start->addYear()];
    }

    private function importReference(ImportTransaction $transaction): string
    {
        return $transaction->customs_ref_no ?: 'IMP-'.str_pad((string) $transaction->id, 4, '0', STR_PAD_LEFT);
    }

    private function exportReference(ExportTransaction $transaction): string
    {
        return $transaction->bl_no ?: 'Export #'.$transaction->id;
    }

    private function transactionReferenceFromModel(?string $modelType, mixed $model): string
    {
        if ($model instanceof ImportTransaction) {
            return $this->importReference($model);
        }

        if ($model instanceof ExportTransaction) {
            return $this->exportReference($model);
        }

        return match ($modelType) {
            ImportTransaction::class => 'Import Transaction',
            ExportTransaction::class => 'Export Transaction',
            default => 'Transaction',
        };
    }

    private function staleDetail(string $status, ?string $assignedTo): string
    {
        $assignee = $assignedTo ? "Assigned to {$assignedTo}." : 'No encoder assigned.';

        return "{$assignee} Current status: {$status}.";
    }

    private function terminalDetail(string $status, ?string $assignedTo, string $suffix): string
    {
        $assignee = $assignedTo ? "Assigned to {$assignedTo}." : 'No encoder assigned.';

        return "{$assignee} {$status} file. {$suffix}";
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
