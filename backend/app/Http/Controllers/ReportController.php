<?php

namespace App\Http\Controllers;

use App\Queries\Reports\ClientReportQuery;
use App\Queries\Reports\MonthlyReportQuery;
use App\Queries\Reports\TurnaroundReportQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        private MonthlyReportQuery $monthlyReportQuery,
        private ClientReportQuery $clientReportQuery,
        private TurnaroundReportQuery $turnaroundReportQuery,
    ) {}

    /**
     * GET /api/reports/monthly?year=2026
     * Monthly import/export volume for the given year.
     */
    public function monthly(Request $request): JsonResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $year = (int) $request->query('year', date('Y'));

        return response()->json($this->monthlyReportQuery->handle($year));
    }

    /**
     * GET /api/reports/clients?year=2026&month=3
     * Transaction counts per client for the given period.
     */
    public function clients(Request $request): JsonResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $year = (int) $request->query('year', date('Y'));
        $month = $request->query('month') !== null ? (int) $request->query('month') : null;

        return response()->json($this->clientReportQuery->handle($year, $month));
    }

    /**
     * GET /api/reports/turnaround?year=2026&month=3
     * Average/min/max days from creation to completion.
     */
    public function turnaround(Request $request): JsonResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $year = (int) $request->query('year', date('Y'));
        $month = $request->query('month') !== null ? (int) $request->query('month') : null;

        return response()->json($this->turnaroundReportQuery->handle($year, $month));
    }
}
