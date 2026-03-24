<?php

namespace App\Queries\Documents;

use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Support\Transactions\ExportStatusWorkflow;
use App\Support\Transactions\ImportStatusWorkflow;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class DocumentTransactionIndexQuery
{
    /**
     * @return array{
     *     data: list<array<string, mixed>>,
     *     counts: array{completed: int, imports: int, exports: int, cancelled: int},
     *     meta: array{current_page: int, last_page: int, per_page: int, total: int}
     * }
     */
    public function handle(Request $request): array
    {
        $search = trim((string) $request->query('search', ''));
        $type = $request->query('type');
        $perPage = min(max((int) $request->input('per_page', 10), 1), 50);
        $importFinalizedStatuses = [ImportStatusWorkflow::completed(), ImportStatus::Cancelled->value];
        $exportFinalizedStatuses = [ExportStatusWorkflow::completed(), ExportStatus::Cancelled->value];

        $importBaseQuery = $this->buildImportBaseQuery($request, $search, $importFinalizedStatuses);
        $exportBaseQuery = $this->buildExportBaseQuery($request, $search, $exportFinalizedStatuses);

        $importsCount = $type === 'export' ? 0 : (clone $importBaseQuery)->count();
        $exportsCount = $type === 'import' ? 0 : (clone $exportBaseQuery)->count();
        $cancelledImportsCount = $type === 'export'
            ? 0
            : (clone $importBaseQuery)->where('status', ImportStatus::Cancelled->value)->count();
        $cancelledExportsCount = $type === 'import'
            ? 0
            : (clone $exportBaseQuery)->where('status', ExportStatus::Cancelled->value)->count();

        $unionQuery = match ($type) {
            'import' => $importBaseQuery->toBase(),
            'export' => $exportBaseQuery->toBase(),
            default => $importBaseQuery->toBase()->unionAll($exportBaseQuery->toBase()),
        };

        $paginator = DB::query()
            ->fromSub($unionQuery, 'document_transactions')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        /** @var Collection<int, object{id: int, type: string}> $items */
        $items = collect($paginator->items());
        $importIds = $items->where('type', 'import')->pluck('id');
        $exportIds = $items->where('type', 'export')->pluck('id');

        /** @var Collection<int, ImportTransaction> $imports */
        $imports = ImportTransaction::query()
            ->visibleTo($request->user())
            ->with(['importer:id,name'])
            ->withCount('documents')
            ->whereIn('id', $importIds)
            ->get()
            ->keyBy('id');

        /** @var Collection<int, ExportTransaction> $exports */
        $exports = ExportTransaction::query()
            ->visibleTo($request->user())
            ->with(['shipper:id,name', 'destinationCountry:id,name'])
            ->withCount('documents')
            ->whereIn('id', $exportIds)
            ->get()
            ->keyBy('id');

        return [
            'data' => $this->mapRows($items, $imports, $exports),
            'counts' => [
                'completed' => ($importsCount + $exportsCount) - ($cancelledImportsCount + $cancelledExportsCount),
                'imports' => $importsCount,
                'exports' => $exportsCount,
                'cancelled' => $cancelledImportsCount + $cancelledExportsCount,
            ],
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    /**
     * @param  list<string>  $finalizedStatuses
     */
    private function buildImportBaseQuery(Request $request, string $search, array $finalizedStatuses): Builder
    {
        $query = ImportTransaction::query()
            ->visibleTo($request->user())
            ->selectRaw("id, 'import' as type, created_at")
            ->whereIn('status', $finalizedStatuses);

        if ($search !== '') {
            $query->where(function (Builder $query) use ($search) {
                $query->where('customs_ref_no', 'like', "%{$search}%")
                    ->orWhere('bl_no', 'like', "%{$search}%")
                    ->orWhereHas('importer', function (Builder $importerQuery) use ($search) {
                        $importerQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        return $query;
    }

    /**
     * @param  list<string>  $finalizedStatuses
     */
    private function buildExportBaseQuery(Request $request, string $search, array $finalizedStatuses): Builder
    {
        $query = ExportTransaction::query()
            ->visibleTo($request->user())
            ->selectRaw("id, 'export' as type, created_at")
            ->whereIn('status', $finalizedStatuses);

        if ($search !== '') {
            $query->where(function (Builder $query) use ($search) {
                $query->where('bl_no', 'like', "%{$search}%")
                    ->orWhere('vessel', 'like', "%{$search}%")
                    ->orWhereHas('shipper', function (Builder $shipperQuery) use ($search) {
                        $shipperQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        return $query;
    }

    /**
     * @param  Collection<int, object{id: int, type: string}>  $items
     * @param  Collection<int, ImportTransaction>  $imports
     * @param  Collection<int, ExportTransaction>  $exports
     * @return list<array<string, mixed>>
     */
    private function mapRows(Collection $items, Collection $imports, Collection $exports): array
    {
        $rows = [];

        foreach ($items as $item) {
            if ($item->type === 'import') {
                $transaction = $imports->get($item->id);

                if (! $transaction) {
                    continue;
                }

                $rows[] = [
                    'id' => $transaction->id,
                    'type' => 'import',
                    'ref' => $transaction->customs_ref_no,
                    'bl_no' => $transaction->bl_no ?? '—',
                    'client' => $transaction->importer?->name ?? '—',
                    'date' => $this->formatDateValue($transaction->arrival_date),
                    'date_label' => 'Arrival',
                    'port' => '—',
                    'vessel' => '—',
                    'status' => $transaction->status,
                    'documents_count' => $transaction->documents_count ?? 0,
                ];

                continue;
            }

            $transaction = $exports->get($item->id);

            if (! $transaction) {
                continue;
            }

            $rows[] = [
                'id' => $transaction->id,
                'type' => 'export',
                'ref' => 'EXP-'.str_pad((string) $transaction->id, 4, '0', STR_PAD_LEFT),
                'bl_no' => $transaction->bl_no ?? '—',
                'client' => $transaction->shipper?->name ?? '—',
                'date' => $this->formatDateValue($transaction->created_at),
                'date_label' => 'Export',
                'port' => $transaction->destinationCountry?->name ?? '—',
                'vessel' => $transaction->vessel ?? '—',
                'status' => $transaction->status,
                'documents_count' => $transaction->documents_count ?? 0,
            ];
        }

        return $rows;
    }

    private function formatDateValue(mixed $value): string
    {
        if (! $value instanceof DateTimeInterface) {
            return '—';
        }

        return $value->format('Y-m-d');
    }
}
