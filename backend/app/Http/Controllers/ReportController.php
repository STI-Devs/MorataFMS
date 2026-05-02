<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReportClientRequest;
use App\Http\Requests\ReportMonthlyRequest;
use App\Http\Requests\ReportTurnaroundRequest;
use App\Queries\Reports\ClientReportQuery;
use App\Queries\Reports\MonthlyReportQuery;
use App\Queries\Reports\TurnaroundReportQuery;
use Illuminate\Http\JsonResponse;

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
    public function monthly(ReportMonthlyRequest $request): JsonResponse
    {
        return response()->json($this->monthlyReportQuery->handle($request->yearValue()));
    }

    /**
     * GET /api/reports/clients?year=2026&month=3
     * Transaction counts per client for the given period.
     */
    public function clients(ReportClientRequest $request): JsonResponse
    {
        return response()->json($this->clientReportQuery->handle($request->yearValue(), $request->monthValue()));
    }

    /**
     * GET /api/reports/turnaround?year=2026&month=3
     * Average/min/max days from creation to completion.
     */
    public function turnaround(ReportTurnaroundRequest $request): JsonResponse
    {
        return response()->json($this->turnaroundReportQuery->handle($request->yearValue(), $request->monthValue()));
    }
}
