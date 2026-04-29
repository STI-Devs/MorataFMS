<?php

namespace App\Queries\Reports;

use App\Enums\ArchiveOrigin;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class MonthlyReportQuery
{
    public function handle(int $year): array
    {
        [$start, $end] = $this->yearBounds($year);

        $imports = $this->monthlyCounts(
            $this->reportableTransactions(ImportTransaction::query())
                ->where('created_at', '>=', $start)
                ->where('created_at', '<', $end)
        );

        $exports = $this->monthlyCounts(
            $this->reportableTransactions(ExportTransaction::query())
                ->where('created_at', '>=', $start)
                ->where('created_at', '<', $end)
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

    private function reportableTransactions(Builder $query): Builder
    {
        return $query->where(function (Builder $archiveQuery): void {
            $archiveQuery
                ->where('is_archive', false)
                ->orWhere('archive_origin', ArchiveOrigin::ArchivedFromLive->value);
        });
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    private function yearBounds(int $year): array
    {
        $start = CarbonImmutable::create($year, 1, 1, 0, 0, 0);

        return [$start, $start->addYear()];
    }
}
