<?php

namespace App\Queries\Dashboard;

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
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class AdminDashboardShowQuery
{
    private const DELAYED_AFTER_HOURS = 48;

    private const CRITICAL_ITEMS_LIMIT = 5;

    private const ACTIVITY_FEED_LIMIT = 5;

    public function handle(): array
    {
        return [
            'kpis' => $this->kpis(),
            'critical_operations' => $this->criticalOperations(),
            'action_feed' => $this->actionFeed(),
            'workloads' => $this->workloads(),
        ];
    }

    private function kpis(): array
    {
        $delayedThreshold = CarbonImmutable::now()->subHours(self::DELAYED_AFTER_HOURS);

        return [
            'active_imports' => ImportTransaction::query()
                ->where('is_archive', false)
                ->whereIn('status', $this->activeImportStatuses())
                ->count(),
            'active_exports' => ExportTransaction::query()
                ->where('is_archive', false)
                ->whereIn('status', $this->activeExportStatuses())
                ->count(),
            'delayed_shipments' => ImportTransaction::query()
                ->where('is_archive', false)
                ->whereIn('status', $this->activeImportStatuses())
                ->where('updated_at', '<=', $delayedThreshold)
                ->count()
                + ExportTransaction::query()
                    ->where('is_archive', false)
                    ->whereIn('status', $this->activeExportStatuses())
                    ->where('updated_at', '<=', $delayedThreshold)
                    ->count(),
            'missing_final_docs' => $this->countMissingRequiredDocuments(
                ImportTransaction::query()
                    ->where('is_archive', false)
                    ->whereIn('status', $this->terminalImportStatuses()),
                $this->requiredDocumentTypes('import'),
            ) + $this->countMissingRequiredDocuments(
                ExportTransaction::query()
                    ->where('is_archive', false)
                    ->whereIn('status', $this->terminalExportStatuses()),
                $this->requiredDocumentTypes('export'),
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
                    'title' => 'Import shipment has not moved recently',
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
                    'title' => 'Export shipment has not moved recently',
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

    private function countMissingRequiredDocuments(Builder $query, array $requiredTypes): int
    {
        return $this->missingDocumentQuery($query, $requiredTypes)->count();
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

    private function importReference(ImportTransaction $transaction): string
    {
        return $transaction->customs_ref_no ?: 'IMP-'.str_pad((string) $transaction->id, 4, '0', STR_PAD_LEFT);
    }

    private function exportReference(ExportTransaction $transaction): string
    {
        return 'EXP-'.str_pad((string) $transaction->id, 4, '0', STR_PAD_LEFT);
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
