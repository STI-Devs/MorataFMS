<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Http\Resources\ImportTransactionResource;
use App\Http\Resources\ExportTransactionResource;
use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    /**
     * GET /api/clients
     * List clients. Admins see all; others see only active.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Client::class);

        $query = Client::with('country')->orderBy('name');

        // Admin sees inactive clients too
        if (!$request->user()->isAdmin()) {
            $query->active();
        }

        if ($type = $request->query('type')) {
            if ($type === 'importer') {
                $query->importers();
            } elseif ($type === 'exporter') {
                $query->exporters();
            }
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('contact_email', 'like', "%{$search}%");
            });
        }

        return ClientResource::collection($query->get());
    }

    /**
     * POST /api/clients
     */
    public function store(StoreClientRequest $request)
    {
        $this->authorize('create', Client::class);

        $client = new Client($request->validated());
        $client->is_active = true; // Server-managed
        $client->save();

        return (new ClientResource($client->load('country')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/clients/{client}
     */
    public function show(Client $client)
    {
        $this->authorize('viewAny', Client::class);

        return new ClientResource($client->load('country'));
    }

    /**
     * PUT /api/clients/{client}
     */
    public function update(UpdateClientRequest $request, Client $client)
    {
        $this->authorize('update', $client);

        $client->fill($request->validated());
        $client->save();

        return new ClientResource($client->load('country'));
    }

    /**
     * DELETE /api/clients/{client}
     */
    public function destroy(Client $client)
    {
        $this->authorize('delete', $client);

        $client->delete();

        return response()->noContent();
    }

    /**
     * POST /api/clients/{client}/toggle-active
     * Toggle client active status (supervisor+).
     */
    public function toggleActive(Client $client)
    {
        $this->authorize('update', $client);

        $client->is_active = !$client->is_active;
        $client->save();

        return new ClientResource($client->load('country'));
    }

    /**
     * GET /api/clients/{client}/transactions
     * Returns all import and export transactions for a given client.
     */
    public function transactions(Client $client)
    {
        $this->authorize('viewAny', Client::class);

        $imports = $client->importTransactions()
            ->with('assignedUser:id,name')
            ->latest()
            ->get();

        $exports = $client->exportTransactions()
            ->with('assignedUser:id,name')
            ->latest()
            ->get();

        return response()->json([
            'transactions' => [
                'imports' => ImportTransactionResource::collection($imports),
                'exports' => ExportTransactionResource::collection($exports),
            ],
        ]);
    }
}
