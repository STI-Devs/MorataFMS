<?php

namespace App\Orchestrators\Clients;

use App\Actions\Clients\CreateClient;
use App\Actions\Clients\DeleteClient;
use App\Actions\Clients\ToggleClientActive;
use App\Actions\Clients\UpdateClient;
use App\Http\Requests\Clients\ClientIndexRequest;
use App\Models\Client;
use App\Queries\Clients\ClientIndexQuery;
use App\Queries\Clients\ClientTransactionsQuery;
use Illuminate\Support\Collection;

class ClientOrchestrator
{
    public function __construct(
        private ClientIndexQuery $clientIndexQuery,
        private ClientTransactionsQuery $clientTransactionsQuery,
        private CreateClient $createClient,
        private UpdateClient $updateClient,
        private DeleteClient $deleteClient,
        private ToggleClientActive $toggleClientActive,
    ) {}

    public function index(ClientIndexRequest $request): Collection
    {
        return $this->clientIndexQuery->handle($request);
    }

    public function store(array $validated): Client
    {
        return $this->createClient->handle($validated);
    }

    public function show(Client $client): Client
    {
        return $client->load('country');
    }

    public function update(Client $client, array $validated): Client
    {
        return $this->updateClient->handle($client, $validated);
    }

    public function delete(Client $client): void
    {
        $this->deleteClient->handle($client);
    }

    public function toggleActive(Client $client): Client
    {
        return $this->toggleClientActive->handle($client);
    }

    public function transactions(Client $client): array
    {
        return $this->clientTransactionsQuery->handle($client);
    }
}
