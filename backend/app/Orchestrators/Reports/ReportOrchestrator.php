<?php

namespace App\Orchestrators\Reports;

use App\Queries\Reports\ClientReportQuery;
use App\Queries\Reports\MonthlyReportQuery;
use App\Queries\Reports\TurnaroundReportQuery;

class ReportOrchestrator
{
    public function __construct(
        private MonthlyReportQuery $monthlyReportQuery,
        private ClientReportQuery $clientReportQuery,
        private TurnaroundReportQuery $turnaroundReportQuery,
    ) {}

    public function monthly(int $year): array
    {
        return $this->monthlyReportQuery->handle($year);
    }

    public function clients(int $year, ?int $month): array
    {
        return $this->clientReportQuery->handle($year, $month);
    }

    public function turnaround(int $year, ?int $month): array
    {
        return $this->turnaroundReportQuery->handle($year, $month);
    }
}
