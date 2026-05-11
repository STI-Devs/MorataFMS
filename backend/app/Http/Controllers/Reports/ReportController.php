<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reports\ReportClientRequest;
use App\Http\Requests\Reports\ReportMonthlyRequest;
use App\Http\Requests\Reports\ReportTurnaroundRequest;
use App\Orchestrators\Reports\ReportOrchestrator;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function __construct(
        private ReportOrchestrator $reports,
    ) {}

    /**
     * GET /api/reports/monthly?year=2026
     * Monthly import/export volume for the given year.
     */
    public function monthly(ReportMonthlyRequest $request): JsonResponse
    {
        return response()->json($this->reports->monthly($request->yearValue()));
    }

    /**
     * GET /api/reports/clients?year=2026&month=3
     * Transaction counts per client for the given period.
     */
    public function clients(ReportClientRequest $request): JsonResponse
    {
        return response()->json($this->reports->clients($request->yearValue(), $request->monthValue()));
    }

    /**
     * GET /api/reports/turnaround?year=2026&month=3
     * Average/min/max days from creation to completion.
     */
    public function turnaround(ReportTurnaroundRequest $request): JsonResponse
    {
        return response()->json($this->reports->turnaround($request->yearValue(), $request->monthValue()));
    }
}
