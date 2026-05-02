<?php

namespace App\Http\Controllers;

use App\Actions\Clients\CreateClient;
use App\Actions\Clients\DeleteClient;
use App\Actions\Clients\ToggleClientActive;
use App\Actions\Clients\UpdateClient;
use App\Http\Requests\ClientIndexRequest;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Queries\Clients\ClientIndexQuery;
use App\Queries\Clients\ClientTransactionsQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ClientController extends Controller
{
    public function __construct(
        private ClientIndexQuery $clientIndexQuery,
        private ClientTransactionsQuery $clientTransactionsQuery,
        private CreateClient $createClient,
        private UpdateClient $updateClient,
        private DeleteClient $deleteClient,
        private ToggleClientActive $toggleClientActive,
    ) {}

    /**
     * GET /api/clients
     * List clients. Admins see all; others see only active.
     */
    public function index(ClientIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Client::class);

        return ClientResource::collection($this->clientIndexQuery->handle($request));
    }

    /**
     * POST /api/clients
     */
    public function store(StoreClientRequest $request): JsonResponse
    {
        $this->authorize('create', Client::class);

        $client = $this->createClient->handle($request->validated());

        return (new ClientResource($client))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/clients/{client}
     */
    public function show(Client $client): ClientResource
    {
        $this->authorize('viewAny', Client::class);

        return new ClientResource($client->load('country'));
    }

    /**
     * PUT /api/clients/{client}
     */
    public function update(UpdateClientRequest $request, Client $client): ClientResource
    {
        $this->authorize('update', $client);

        $client = $this->updateClient->handle($client, $request->validated());

        return new ClientResource($client);
    }

    /**
     * DELETE /api/clients/{client}
     */
    public function destroy(Client $client): Response
    {
        $this->authorize('delete', $client);

        $this->deleteClient->handle($client);

        return response()->noContent();
    }

    /**
     * POST /api/clients/{client}/toggle-active
     * Toggle client active status (admin only).
     */
    public function toggleActive(Client $client): ClientResource
    {
        $this->authorize('update', $client);

        $client = $this->toggleClientActive->handle($client);

        return new ClientResource($client);
    }

    /**
     * GET /api/clients/{client}/transactions
     * Returns all import and export transactions for a given client.
     * Admin-only: cross-encoder transaction visibility is an oversight feature.
     */
    public function transactions(Client $client): JsonResponse
    {
        $this->authorize('viewTransactions', $client);

        return response()->json([
            'transactions' => $this->clientTransactionsQuery->handle($client),
        ]);
    }
}
