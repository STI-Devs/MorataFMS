<?php

namespace App\Queries\Reports;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Carbon\CarbonImmutable;

class ClientReportQuery
{
    public function handle(int $year, ?int $month = null): array
    {
        [$start, $end] = $this->periodBounds($year, $month);

        $importQuery = ImportTransaction::query()
            ->where('is_archive', false)
            ->where('import_transactions.created_at', '>=', $start)
            ->where('import_transactions.created_at', '<', $end)
            ->join('clients', 'import_transactions.importer_id', '=', 'clients.id')
            ->selectRaw('clients.id as client_id, clients.name as client_name, clients.type as client_type, COUNT(*) as imports');

        $importCounts = $importQuery
            ->groupBy('clients.id', 'clients.name', 'clients.type')
            ->get()
            ->keyBy('client_id');

        $exportQuery = ExportTransaction::query()
            ->where('is_archive', false)
            ->where('export_transactions.created_at', '>=', $start)
            ->where('export_transactions.created_at', '<', $end)
            ->join('clients', 'export_transactions.shipper_id', '=', 'clients.id')
            ->selectRaw('clients.id as client_id, clients.name as client_name, clients.type as client_type, COUNT(*) as exports');

        $exportCounts = $exportQuery
            ->groupBy('clients.id', 'clients.name', 'clients.type')
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
}
