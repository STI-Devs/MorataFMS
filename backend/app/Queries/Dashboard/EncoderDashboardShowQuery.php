<?php

namespace App\Queries\Dashboard;

use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class EncoderDashboardShowQuery
{
    private const NEEDS_UPDATE_AFTER_HOURS = 48;

    private const ATTENTION_ITEMS_LIMIT = 6;

    public function handle(User $encoder): array
    {
        return [
            'kpis' => $this->kpis($encoder),
            'attention_items' => $this->attentionItems($encoder),
        ];
    }

    private function kpis(User $encoder): array
    {
        $needsUpdateThreshold = CarbonImmutable::now()->subHours(self::NEEDS_UPDATE_AFTER_HOURS);

        return [
            'active_imports' => $this->assignedActiveImports($encoder)->count(),
            'active_exports' => $this->assignedActiveExports($encoder)->count(),
            'needs_update' => $this->assignedActiveImports($encoder)
                ->where('updated_at', '<=', $needsUpdateThreshold)
                ->count()
                + $this->assignedActiveExports($encoder)
                    ->where('updated_at', '<=', $needsUpdateThreshold)
                    ->count(),
            'upcoming_eta_etd' => $this->countUpcomingImportArrivals($encoder) + $this->countUpcomingExportDepartures($encoder),
            'open_remarks' => $this->countOpenRemarks($encoder),
            'document_gaps' => $this->countMissingRequiredDocuments(
                ImportTransaction::query()
                    ->where('assigned_user_id', $encoder->id)
                    ->where('is_archive', false)
                    ->whereIn('status', $this->terminalImportStatuses()),
                $this->requiredDocumentTypes('import'),
            ) + $this->countMissingRequiredDocuments(
                ExportTransaction::query()
                    ->where('assigned_user_id', $encoder->id)
                    ->where('is_archive', false)
                    ->whereIn('status', $this->terminalExportStatuses()),
                $this->requiredDocumentTypes('export'),
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
