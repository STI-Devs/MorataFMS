<?php

namespace App\Queries\Reports;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class MonthlyReportQuery
{
    public function handle(int $year): array
    {
        $imports = $this->monthlyCounts(
            ImportTransaction::query()
                ->where('is_archive', false)
                ->whereYear('created_at', $year)
        );

        $exports = $this->monthlyCounts(
            ExportTransaction::query()
                ->where('is_archive', false)
                ->whereYear('created_at', $year)
        );

        $months = [];
        $totalImports = 0;
        $totalExports = 0;

        for ($month = 1; $month <= 12; $month++) {
            $importCount = $imports->get($month, 0);
            $exportCount = $exports->get($month, 0);

            $totalImports += $importCount;
            $totalExports += $exportCount;

            $months[] = [
                'month' => $month,
                'imports' => $importCount,
                'exports' => $exportCount,
                'total' => $importCount + $exportCount,
            ];
        }

        return [
            'months' => $months,
            'total_imports' => $totalImports,
            'total_exports' => $totalExports,
            'total' => $totalImports + $totalExports,
        ];
    }

    private function monthlyCounts(Builder $query)
    {
        $driver = DB::connection()->getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            return (clone $query)
                ->selectRaw('MONTH(created_at) as month, COUNT(*) as count')
                ->groupByRaw('MONTH(created_at)')
                ->pluck('count', 'month');
        }

        if ($driver === 'sqlite') {
            return (clone $query)
                ->selectRaw("CAST(strftime('%m', created_at) AS INTEGER) as month, COUNT(*) as count")
                ->groupByRaw("strftime('%m', created_at)")
                ->pluck('count', 'month');
        }

        return (clone $query)
            ->get(['created_at'])
            ->groupBy(fn ($record) => $record->created_at?->month)
            ->map->count();
    }
}
