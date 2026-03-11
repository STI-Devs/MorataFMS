<?php

namespace App\Http\Controllers;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * GET /api/reports/monthly?year=2026
     * Monthly import/export volume for the given year.
     */
    public function monthly(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $year = (int) $request->query('year', date('Y'));

        // Get monthly counts for imports (non-archive only)
        $imports = ImportTransaction::where('is_archive', false)
            ->whereYear('created_at', $year)
            ->selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->groupByRaw('MONTH(created_at)')
            ->pluck('count', 'month');

        $exports = ExportTransaction::where('is_archive', false)
            ->whereYear('created_at', $year)
            ->selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->groupByRaw('MONTH(created_at)')
            ->pluck('count', 'month');

        $months = [];
        $totalImports = 0;
        $totalExports = 0;

        for ($m = 1; $m <= 12; $m++) {
            $imp = $imports->get($m, 0);
            $exp = $exports->get($m, 0);
            $totalImports += $imp;
            $totalExports += $exp;
            $months[] = [
                'month' => $m,
                'imports' => $imp,
                'exports' => $exp,
                'total' => $imp + $exp,
            ];
        }

        return response()->json([
            'months' => $months,
            'total_imports' => $totalImports,
            'total_exports' => $totalExports,
            'total' => $totalImports + $totalExports,
        ]);
    }

    /**
     * GET /api/reports/clients?year=2026&month=3
     * Transaction counts per client for the given period.
     */
    public function clients(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $year = (int) $request->query('year', date('Y'));
        $month = $request->query('month');

        // Import counts per client
        $importQuery = ImportTransaction::where('is_archive', false)
            ->whereYear('import_transactions.created_at', $year)
            ->join('clients', 'import_transactions.importer_id', '=', 'clients.id')
            ->selectRaw('clients.id as client_id, clients.name as client_name, clients.type as client_type, COUNT(*) as imports');

        if ($month) {
            $importQuery->whereMonth('import_transactions.created_at', $month);
        }

        $importCounts = $importQuery->groupBy('clients.id', 'clients.name', 'clients.type')
            ->get()
            ->keyBy('client_id');

        // Export counts per client
        $exportQuery = ExportTransaction::where('is_archive', false)
            ->whereYear('export_transactions.created_at', $year)
            ->join('clients', 'export_transactions.shipper_id', '=', 'clients.id')
            ->selectRaw('clients.id as client_id, clients.name as client_name, clients.type as client_type, COUNT(*) as exports');

        if ($month) {
            $exportQuery->whereMonth('export_transactions.created_at', $month);
        }

        $exportCounts = $exportQuery->groupBy('clients.id', 'clients.name', 'clients.type')
            ->get()
            ->keyBy('client_id');

        // Merge both into a single list
        $clientIds = $importCounts->keys()->merge($exportCounts->keys())->unique();
        $clients = [];

        foreach ($clientIds as $clientId) {
            $imp = $importCounts->get($clientId);
            $exp = $exportCounts->get($clientId);

            $importCount = $imp ? $imp->imports : 0;
            $exportCount = $exp ? $exp->exports : 0;

            $clients[] = [
                'client_id' => $clientId,
                'client_name' => $imp?->client_name ?? $exp?->client_name,
                'client_type' => $imp?->client_type ?? $exp?->client_type,
                'imports' => $importCount,
                'exports' => $exportCount,
                'total' => $importCount + $exportCount,
            ];
        }

        // Sort by total desc
        usort($clients, fn($a, $b) => $b['total'] - $a['total']);

        return response()->json(['clients' => $clients]);
    }

    /**
     * GET /api/reports/turnaround?year=2026&month=3
     * Average/min/max days from creation to completion.
     */
    public function turnaround(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $year = (int) $request->query('year', date('Y'));
        $month = $request->query('month');

        $importQuery = ImportTransaction::where('is_archive', false)
            ->where('status', 'completed')
            ->whereYear('created_at', $year);

        if ($month) {
            $importQuery->whereMonth('created_at', $month);
        }

        $importStats = $importQuery->selectRaw('
            COUNT(*) as completed_count,
            ROUND(AVG(DATEDIFF(updated_at, created_at)), 1) as avg_days,
            MIN(DATEDIFF(updated_at, created_at)) as min_days,
            MAX(DATEDIFF(updated_at, created_at)) as max_days
        ')->first();

        $exportQuery = ExportTransaction::where('is_archive', false)
            ->where('status', 'completed')
            ->whereYear('created_at', $year);

        if ($month) {
            $exportQuery->whereMonth('created_at', $month);
        }

        $exportStats = $exportQuery->selectRaw('
            COUNT(*) as completed_count,
            ROUND(AVG(DATEDIFF(updated_at, created_at)), 1) as avg_days,
            MIN(DATEDIFF(updated_at, created_at)) as min_days,
            MAX(DATEDIFF(updated_at, created_at)) as max_days
        ')->first();

        return response()->json([
            'imports' => [
                'completed_count' => $importStats->completed_count ?? 0,
                'avg_days' => $importStats->avg_days,
                'min_days' => $importStats->min_days,
                'max_days' => $importStats->max_days,
            ],
            'exports' => [
                'completed_count' => $exportStats->completed_count ?? 0,
                'avg_days' => $exportStats->avg_days,
                'min_days' => $exportStats->min_days,
                'max_days' => $exportStats->max_days,
            ],
        ]);
    }
}
