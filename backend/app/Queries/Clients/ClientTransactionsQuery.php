<?php

namespace App\Queries\Clients;

use App\Http\Resources\ExportTransactionResource;
use App\Http\Resources\ImportTransactionResource;
use App\Models\Client;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ClientTransactionsQuery
{
    /**
     * @return array{
     *     imports: AnonymousResourceCollection,
     *     exports: AnonymousResourceCollection
     * }
     */
    public function handle(Client $client): array
    {
        $imports = $client->importTransactions()
            ->with('assignedUser:id,name')
            ->latest()
            ->get();

        $exports = $client->exportTransactions()
            ->with('assignedUser:id,name')
            ->latest()
            ->get();

        return [
            'imports' => ImportTransactionResource::collection($imports),
            'exports' => ExportTransactionResource::collection($exports),
        ];
    }
}
