<?php

namespace App\Queries\Reports;

use App\Enums\ArchiveOrigin;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Support\Transactions\ExportStatusWorkflow;
use App\Support\Transactions\ImportStatusWorkflow;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class TurnaroundReportQuery
{
    public function handle(int $year, ?int $month = null): array
    {
        [$start, $end] = $this->periodBounds($year, $month);

        $importQuery = $this->reportableTransactions(ImportTransaction::query(), 'import_transactions')
            ->leftJoin('import_stages', 'import_stages.import_transaction_id', '=', 'import_transactions.id')
            ->where('import_transactions.status', ImportStatusWorkflow::completed())
            ->where('import_transactions.created_at', '>=', $start)
            ->where('import_transactions.created_at', '<', $end);

        $exportQuery = $this->reportableTransactions(ExportTransaction::query(), 'export_transactions')
            ->leftJoin('export_stages', 'export_stages.export_transaction_id', '=', 'export_transactions.id')
            ->where('export_transactions.status', ExportStatusWorkflow::completed())
            ->where('export_transactions.created_at', '>=', $start)
            ->where('export_transactions.created_at', '<', $end);

        return [
            'imports' => $this->statsFor(
                $importQuery,
                'import_transactions.created_at',
                'COALESCE(import_stages.billing_completed_at, import_transactions.updated_at)'
            ),
            'exports' => $this->statsFor(
                $exportQuery,
                'export_transactions.created_at',
                'COALESCE(export_stages.billing_completed_at, export_transactions.updated_at)'
            ),
        ];
    }

    private function statsFor(Builder $query, string $createdAtColumn, string $completedAtExpression): array
    {
        $driver = DB::connection()->getDriverName();

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            $dayDifference = "DATEDIFF($completedAtExpression, $createdAtColumn)";
            $stats = (clone $query)->selectRaw("
                COUNT(*) as completed_count,
                ROUND(AVG($dayDifference), 1) as avg_days,
                MIN($dayDifference) as min_days,
                MAX($dayDifference) as max_days
            ")->first();

            return $this->formatStats($stats);
        }

        if ($driver === 'sqlite') {
            $dayDifference = "julianday(date($completedAtExpression)) - julianday(date($createdAtColumn))";
            $stats = (clone $query)->selectRaw("
                COUNT(*) as completed_count,
                ROUND(AVG($dayDifference), 1) as avg_days,
                MIN(CAST($dayDifference AS INTEGER)) as min_days,
                MAX(CAST($dayDifference AS INTEGER)) as max_days
            ")->first();

            return $this->formatStats($stats);
        }

        $durations = (clone $query)
            ->selectRaw($createdAtColumn.' as created_at, '.$completedAtExpression.' as completed_at')
            ->get()
            ->map(function ($record) {
                if ($record->completed_at === null || $record->created_at === null) {
                    return null;
                }

                return CarbonImmutable::parse($record->completed_at)
                    ->diffInDays(CarbonImmutable::parse($record->created_at));
            })
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

    private function reportableTransactions(Builder $query, string $table): Builder
    {
        return $query->where(function (Builder $archiveQuery) use ($table): void {
            $archiveQuery
                ->where("{$table}.is_archive", false)
                ->orWhere("{$table}.archive_origin", ArchiveOrigin::ArchivedFromLive->value);
        });
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

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    private function periodBounds(int $year, ?int $month = null): array
    {
        $start = CarbonImmutable::create($year, $month ?? 1, 1, 0, 0, 0);

        if ($month === null) {
            return [$start, $start->addYear()];
        }

        return [$start, $start->addMonth()];
    }
}
