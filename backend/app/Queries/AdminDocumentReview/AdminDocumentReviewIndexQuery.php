<?php

namespace App\Queries\AdminDocumentReview;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Support\AdminDocumentReview\AdminDocumentReviewData;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AdminDocumentReviewIndexQuery
{
    public function __construct(
        private AdminDocumentReviewData $reviewData,
    ) {}

    public function handle(Request $request): array
    {
        $search = trim((string) $request->query('search', ''));
        $typeFilter = $this->reviewData->normalizeTypeFilter($request->query('type'));
        $statusFilter = $this->reviewData->normalizeStatusFilter($request->query('status'));
        $readinessFilter = $this->reviewData->normalizeReadinessFilter($request->query('readiness'));
        $assignedUserId = $this->reviewData->normalizeAssignedUserFilter($request->query('assigned_user_id'));
        $perPage = min(max((int) $request->query('per_page', 10), 1), 50);

        $importBaseQuery = $this->buildImportQueueBaseQuery($search, $statusFilter, $readinessFilter, $assignedUserId);
        $exportBaseQuery = $this->buildExportQueueBaseQuery($search, $statusFilter, $readinessFilter, $assignedUserId);

        $unionQuery = match ($typeFilter) {
            'import' => $importBaseQuery->toBase(),
            'export' => $exportBaseQuery->toBase(),
            default => $importBaseQuery->toBase()->unionAll($exportBaseQuery->toBase()),
        };

        $paginator = DB::query()
            ->fromSub($unionQuery, 'admin_document_review_queue')
            ->orderByDesc('finalized_at')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        $items = collect($paginator->items());
        $imports = $this->loadQueueImports($items->where('type', 'import')->pluck('id'));
        $exports = $this->loadQueueExports($items->where('type', 'export')->pluck('id'));

        return [
            'data' => $this->reviewData->mapQueueRows($items, $imports, $exports),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    private function buildImportQueueBaseQuery(
        string $search,
        string $statusFilter,
        string $readinessFilter,
        ?int $assignedUserId,
    ): Builder {
        $query = ImportTransaction::query()
            ->leftJoin('import_stages', 'import_stages.import_transaction_id', '=', 'import_transactions.id')
            ->selectRaw("
                import_transactions.id,
                'import' as type,
                import_transactions.created_at as created_at,
                COALESCE(import_stages.billing_completed_at, import_transactions.updated_at) as finalized_at
            ")
            ->where('import_transactions.is_archive', false)
            ->whereIn('import_transactions.status', $this->reviewData->importStatusValues($statusFilter));

        if ($assignedUserId !== null) {
            $query->where('import_transactions.assigned_user_id', $assignedUserId);
        }

        if ($search !== '') {
            $query->where(function (Builder $searchQuery) use ($search) {
                $searchQuery
                    ->where('import_transactions.bl_no', 'like', "%{$search}%")
                    ->orWhere('import_transactions.customs_ref_no', 'like', "%{$search}%")
                    ->orWhere('import_transactions.vessel_name', 'like', "%{$search}%")
                    ->orWhereHas('importer', function (Builder $clientQuery) use ($search) {
                        $clientQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $this->reviewData->applyReadinessFilter($query, 'import', $readinessFilter);

        return $query;
    }

    private function buildExportQueueBaseQuery(
        string $search,
        string $statusFilter,
        string $readinessFilter,
        ?int $assignedUserId,
    ): Builder {
        $query = ExportTransaction::query()
            ->leftJoin('export_stages', 'export_stages.export_transaction_id', '=', 'export_transactions.id')
            ->selectRaw("
                export_transactions.id,
                'export' as type,
                export_transactions.created_at as created_at,
                COALESCE(export_stages.billing_completed_at, export_transactions.updated_at) as finalized_at
            ")
            ->where('export_transactions.is_archive', false)
            ->whereIn('export_transactions.status', $this->reviewData->exportStatusValues($statusFilter));

        if ($assignedUserId !== null) {
            $query->where('export_transactions.assigned_user_id', $assignedUserId);
        }

        if ($search !== '') {
            $query->where(function (Builder $searchQuery) use ($search) {
                $searchQuery
                    ->where('export_transactions.bl_no', 'like', "%{$search}%")
                    ->orWhere('export_transactions.vessel', 'like', "%{$search}%")
                    ->orWhereRaw($this->reviewData->exportReferenceExpression().' like ?', ["%{$search}%"])
                    ->orWhereHas('shipper', function (Builder $clientQuery) use ($search) {
                        $clientQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $this->reviewData->applyReadinessFilter($query, 'export', $readinessFilter);

        return $query;
    }

    private function loadQueueImports(Collection $ids): Collection
    {
        if ($ids->isEmpty()) {
            return collect();
        }

        return ImportTransaction::query()
            ->select([
                'id',
                'customs_ref_no',
                'bl_no',
                'vessel_name',
                'importer_id',
                'assigned_user_id',
                'status',
                'arrival_date',
                'updated_at',
            ])
            ->with([
                'importer:id,name',
                'assignedUser:id,name',
                'stages:import_transaction_id,billing_completed_at,bonds_not_applicable,ppa_not_applicable,port_charges_not_applicable',
                'documents:id,documentable_id,documentable_type,type',
                'remarks:id,remarkble_id,remarkble_type,is_resolved',
            ])
            ->whereIn('id', $ids->all())
            ->get()
            ->keyBy('id');
    }

    private function loadQueueExports(Collection $ids): Collection
    {
        if ($ids->isEmpty()) {
            return collect();
        }

        return ExportTransaction::query()
            ->select([
                'id',
                'bl_no',
                'vessel',
                'shipper_id',
                'assigned_user_id',
                'status',
                'export_date',
                'updated_at',
            ])
            ->with([
                'shipper:id,name',
                'assignedUser:id,name',
                'stages:export_transaction_id,billing_completed_at,phytosanitary_not_applicable,co_not_applicable,dccci_not_applicable',
                'documents:id,documentable_id,documentable_type,type',
                'remarks:id,remarkble_id,remarkble_type,is_resolved',
            ])
            ->whereIn('id', $ids->all())
            ->get()
            ->keyBy('id');
    }
}
