<?php

namespace App\Queries\Reports;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;

class ClientReportQuery
{
    public function handle(int $year, ?int $month = null): array
    {
        $importQuery = ImportTransaction::query()
            ->where('is_archive', false)
            ->whereYear('import_transactions.created_at', $year)
            ->join('clients', 'import_transactions.importer_id', '=', 'clients.id')
            ->selectRaw('clients.id as client_id, clients.name as client_name, clients.type as client_type, COUNT(*) as imports');

        if ($month !== null) {
            $importQuery->whereMonth('import_transactions.created_at', $month);
        }

        $importCounts = $importQuery
            ->groupBy('clients.id', 'clients.name', 'clients.type')
            ->get()
            ->keyBy('client_id');

        $exportQuery = ExportTransaction::query()
            ->where('is_archive', false)
            ->whereYear('export_transactions.created_at', $year)
            ->join('clients', 'export_transactions.shipper_id', '=', 'clients.id')
            ->selectRaw('clients.id as client_id, clients.name as client_name, clients.type as client_type, COUNT(*) as exports');

        if ($month !== null) {
            $exportQuery->whereMonth('export_transactions.created_at', $month);
        }

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
}
