<?php

namespace App\Queries\Transactions;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Support\Transactions\ExportStatusWorkflow;
use App\Support\Transactions\ImportStatusWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionOversightIndexQuery
{
    public function handle(Request $request): array
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $type = $request->query('type');
        $perPage = min(max((int) $request->input('per_page', 15), 1), 50);

        $importQuery = ImportTransaction::query()
            ->selectRaw("id, 'import' as type, created_at")
            ->where('is_archive', false);

        if ($search) {
            $importQuery->where(function ($query) use ($search) {
                $query->where('customs_ref_no', 'like', "%{$search}%")
                    ->orWhere('bl_no', 'like', "%{$search}%")
                    ->orWhereHas('importer', fn ($importerQuery) => $importerQuery->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('assignedUser', fn ($userQuery) => $userQuery->where('name', 'like', "%{$search}%"));
            });
        }

        $importStatuses = ImportStatusWorkflow::filterStatuses($status);
        if ($status && $status !== 'all' && ! empty($importStatuses)) {
            count($importStatuses) === 1
                ? $importQuery->where('status', $importStatuses[0])
                : $importQuery->whereIn('status', $importStatuses);
        }

        $exportQuery = ExportTransaction::query()
            ->selectRaw("id, 'export' as type, created_at")
            ->where('is_archive', false);

        if ($search) {
            $exportQuery->where(function ($query) use ($search) {
                $query->where('bl_no', 'like', "%{$search}%")
                    ->orWhere('vessel', 'like', "%{$search}%")
                    ->orWhereHas('shipper', fn ($shipperQuery) => $shipperQuery->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('assignedUser', fn ($userQuery) => $userQuery->where('name', 'like', "%{$search}%"));
            });
        }

        $exportStatuses = ExportStatusWorkflow::filterStatuses($status);
        if ($status && $status !== 'all' && ! empty($exportStatuses)) {
            count($exportStatuses) === 1
                ? $exportQuery->where('status', $exportStatuses[0])
                : $exportQuery->whereIn('status', $exportStatuses);
        }

        $importsCount = $type === 'export' ? 0 : (clone $importQuery)->count();
        $exportsCount = $type === 'import' ? 0 : (clone $exportQuery)->count();

        $unionQuery = match ($type) {
            'import' => $importQuery->toBase(),
            'export' => $exportQuery->toBase(),
            default => $importQuery->toBase()->unionAll($exportQuery->toBase()),
        };

        $paginator = DB::query()
            ->fromSub($unionQuery, 'oversight_transactions')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        $items = collect($paginator->items());
        $importIds = $items->where('type', 'import')->pluck('id');
        $exportIds = $items->where('type', 'export')->pluck('id');

        $imports = ImportTransaction::with(['importer:id,name', 'assignedUser:id,name', 'stages'])
            ->withCount(['remarks as open_remarks_count' => fn ($query) => $query->where('is_resolved', false)])
            ->whereIn('id', $importIds)
            ->get()
            ->keyBy('id');

        $exports = ExportTransaction::with(['shipper:id,name', 'assignedUser:id,name', 'destinationCountry:id,name', 'stages'])
            ->withCount(['remarks as open_remarks_count' => fn ($query) => $query->where('is_resolved', false)])
            ->whereIn('id', $exportIds)
            ->get()
            ->keyBy('id');

        $data = $items->map(function ($item) use ($imports, $exports) {
            if ($item->type === 'import') {
                $transaction = $imports->get($item->id);

                if (! $transaction) {
                    return null;
                }

                return [
                    'id' => $transaction->id,
                    'type' => 'import',
                    'reference_no' => $transaction->customs_ref_no,
                    'bl_no' => $transaction->bl_no,
                    'client' => $transaction->importer?->name,
                    'client_id' => $transaction->importer_id,
                    'date' => $transaction->arrival_date?->toDateString(),
                    'status' => $transaction->status,
                    'selective_color' => $transaction->selective_color,
                    'assigned_to' => $transaction->assignedUser?->name,
                    'assigned_user_id' => $transaction->assigned_user_id,
                    'open_remarks_count' => $transaction->open_remarks_count ?? 0,
                    'created_at' => $transaction->created_at?->toISOString(),
                    'stages' => $transaction->stages ? [
                        'boc' => $transaction->stages->boc_status,
                        'ppa' => $transaction->stages->ppa_status,
                        'do' => $transaction->stages->do_status,
                        'port_charges' => $transaction->stages->port_charges_status,
                        'releasing' => $transaction->stages->releasing_status,
                        'billing' => $transaction->stages->billing_status,
                    ] : null,
                ];
            }

            $transaction = $exports->get($item->id);

            if (! $transaction) {
                return null;
            }

            return [
                'id' => $transaction->id,
                'type' => 'export',
                'reference_no' => null,
                'bl_no' => $transaction->bl_no,
                'client' => $transaction->shipper?->name,
                'client_id' => $transaction->shipper_id,
                'vessel' => $transaction->vessel,
                'destination' => $transaction->destinationCountry?->name,
                'date' => $transaction->created_at?->toDateString(),
                'status' => $transaction->status,
                'selective_color' => null,
                'assigned_to' => $transaction->assignedUser?->name,
                'assigned_user_id' => $transaction->assigned_user_id,
                'open_remarks_count' => $transaction->open_remarks_count ?? 0,
                'created_at' => $transaction->created_at?->toISOString(),
                'stages' => $transaction->stages ? [
                    'docs_prep' => $transaction->stages->docs_prep_status,
                    'co' => $transaction->stages->co_status,
                    'cil' => $transaction->stages->cil_status,
                    'bl' => $transaction->stages->bl_status,
                ] : null,
            ];
        })->filter()->values();

        return [
            'data' => $data,
            'total' => $importsCount + $exportsCount,
            'imports_count' => $importsCount,
            'exports_count' => $exportsCount,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total_records' => $paginator->total(),
            ],
        ];
    }
}
