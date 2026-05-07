<?php

namespace App\Queries\Reports;

use App\Enums\ArchiveOrigin;
use App\Models\Client;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

class ClientReportQuery
{
    public function handle(int $year, ?int $month = null): array
    {
        [$start, $end] = $this->periodBounds($year, $month);

        $clientsTable = (new Client)->getTable();

        $importQuery = $this->reportableTransactions(ImportTransaction::query(), 'import_transactions')
            ->where('import_transactions.created_at', '>=', $start)
            ->where('import_transactions.created_at', '<', $end)
            ->join($clientsTable, 'import_transactions.importer_id', '=', "{$clientsTable}.id")
            ->selectRaw("{$clientsTable}.id as client_id, {$clientsTable}.name as client_name, {$clientsTable}.type as client_type, COUNT(*) as imports");

        $importCounts = $importQuery
            ->groupBy("{$clientsTable}.id", "{$clientsTable}.name", "{$clientsTable}.type")
            ->get()
            ->keyBy('client_id');

        $exportQuery = $this->reportableTransactions(ExportTransaction::query(), 'export_transactions')
            ->where('export_transactions.created_at', '>=', $start)
            ->where('export_transactions.created_at', '<', $end)
            ->join($clientsTable, 'export_transactions.shipper_id', '=', "{$clientsTable}.id")
            ->selectRaw("{$clientsTable}.id as client_id, {$clientsTable}.name as client_name, {$clientsTable}.type as client_type, COUNT(*) as exports");

        $exportCounts = $exportQuery
            ->groupBy("{$clientsTable}.id", "{$clientsTable}.name", "{$clientsTable}.type")
            ->get()
            ->keyBy('client_id');

        $clientIds = $importCounts->keys()->merge($exportCounts->keys())->unique();
        $clients = [];

        foreach ($clientIds as $clientId) {
            $importRecord = $importCounts->get($clientId);
            $exportRecord = $exportCounts->get($clientId);

            $imports = $importRecord?->imports ?? 0;
            $exports = $exportRecord?->exports ?? 0;

            $clients[] = [
                'client_id' => $clientId,
                'client_name' => $importRecord?->client_name ?? $exportRecord?->client_name,
                'client_type' => $importRecord?->client_type ?? $exportRecord?->client_type,
                'imports' => $imports,
                'exports' => $exports,
                'total' => $imports + $exports,
            ];
        }

        usort($clients, fn (array $left, array $right) => $right['total'] <=> $left['total']);

        return ['clients' => $clients];
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

    private function reportableTransactions(Builder $query, string $table): Builder
    {
        return $query->where(function (Builder $archiveQuery) use ($table): void {
            $archiveQuery
                ->where("{$table}.is_archive", false)
                ->orWhere("{$table}.archive_origin", ArchiveOrigin::ArchivedFromLive->value);
        });
    }
}
