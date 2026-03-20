<?php

namespace App\Queries\Reports;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Support\Transactions\ExportStatusWorkflow;
use App\Support\Transactions\ImportStatusWorkflow;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class TurnaroundReportQuery
{
    public function handle(int $year, ?int $month = null): array
    {
        $importQuery = ImportTransaction::query()
            ->where('is_archive', false)
            ->where('status', ImportStatusWorkflow::completed())
            ->whereYear('created_at', $year);

        if ($month !== null) {
            $importQuery->whereMonth('created_at', $month);
        }

        $exportQuery = ExportTransaction::query()
            ->where('is_archive', false)
            ->where('status', ExportStatusWorkflow::completed())
            ->whereYear('created_at', $year);

        if ($month !== null) {
            $exportQuery->whereMonth('created_at', $month);
        }

        return [
            'imports' => $this->statsFor($importQuery),
            'exports' => $this->statsFor($exportQuery),
        ];
    }

    private function statsFor(Builder $query): array
    {
        $driver = DB::connection()->getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            $stats = (clone $query)->selectRaw('
                COUNT(*) as completed_count,
                ROUND(AVG(DATEDIFF(updated_at, created_at)), 1) as avg_days,
                MIN(DATEDIFF(updated_at, created_at)) as min_days,
                MAX(DATEDIFF(updated_at, created_at)) as max_days
            ')->first();

            return $this->formatStats($stats);
        }

        if ($driver === 'sqlite') {
            $stats = (clone $query)->selectRaw('
                COUNT(*) as completed_count,
                ROUND(AVG(julianday(date(updated_at)) - julianday(date(created_at))), 1) as avg_days,
                MIN(CAST(julianday(date(updated_at)) - julianday(date(created_at)) AS INTEGER)) as min_days,
                MAX(CAST(julianday(date(updated_at)) - julianday(date(created_at)) AS INTEGER)) as max_days
            ')->first();

            return $this->formatStats($stats);
        }

        $durations = (clone $query)->get(['created_at', 'updated_at'])
            ->map(fn ($record) => $record->updated_at?->diffInDays($record->created_at))
            ->filter(fn ($value) => $value !== null)
            ->values();

        if ($durations->isEmpty()) {
            return [
                'completed_count' => 0,
                'avg_days' => null,
                'min_days' => null,
                'max_days' => null,
            ];
        }

        return [
            'completed_count' => $durations->count(),
            'avg_days' => round($durations->avg(), 1),
            'min_days' => $durations->min(),
            'max_days' => $durations->max(),
        ];
    }

    private function formatStats(?object $stats): array
    {
        return [
            'completed_count' => (int) ($stats->completed_count ?? 0),
            'avg_days' => $stats?->avg_days !== null ? (float) $stats->avg_days : null,
            'min_days' => $stats?->min_days !== null ? (int) $stats->min_days : null,
            'max_days' => $stats?->max_days !== null ? (int) $stats->max_days : null,
        ];
    }
}
