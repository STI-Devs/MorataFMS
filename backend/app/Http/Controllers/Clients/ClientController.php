<?php

namespace App\Http\Controllers\Clients;

use App\Http\Controllers\Controller;
use App\Http\Requests\Clients\ClientIndexRequest;
use App\Http\Requests\Clients\StoreClientRequest;
use App\Http\Requests\Clients\UpdateClientRequest;
use App\Http\Resources\Clients\ClientResource;
use App\Models\Client;
use App\Orchestrators\Clients\ClientOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ClientController extends Controller
{
    public function __construct(
        private ClientOrchestrator $clients,
    ) {}

    public function index(ClientIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Client::class);

        return ClientResource::collection($this->clients->index($request));
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        $this->authorize('create', Client::class);

        return (new ClientResource($this->clients->store($request->validated())))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Client $client): ClientResource
    {
        $this->authorize('viewAny', Client::class);

        return new ClientResource($this->clients->show($client));
    }

    public function update(UpdateClientRequest $request, Client $client): ClientResource
    {
        $this->authorize('update', $client);

        return new ClientResource($this->clients->update($client, $request->validated()));
    }

    public function destroy(Client $client): Response
    {
        $this->authorize('delete', $client);

        $this->clients->delete($client);

        return response()->noContent();
    }

    public function toggleActive(Client $client): ClientResource
    {
        $this->authorize('update', $client);

        return new ClientResource($this->clients->toggleActive($client));
    }

    public function transactions(Client $client): JsonResponse
    {
        $this->authorize('viewTransactions', $client);

        return response()->json([
            'transactions' => $this->clients->transactions($client),
        ]);
    }
}
