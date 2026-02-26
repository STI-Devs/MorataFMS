<?php

namespace App\Http\Controllers;

use App\Http\Resources\ClientResource;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClientController extends Controller
{
    /**
     * GET /api/clients
     * List active clients, optionally filtered by type.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Client::class);

        $query = Client::active()->orderBy('name');

        // Filter by type (importer, exporter, both)
        if ($type = $request->query('type')) {
            if ($type === 'importer') {
                $query->importers();
            } elseif ($type === 'exporter') {
                $query->exporters();
            }
        }

        return ClientResource::collection($query->get());
    }

    /**
     * POST /api/clients
     * Create a new client. Used during archive uploads when the client
     * doesn't exist in the system yet. Any authenticated user can create
     * a basic client record; full details can be filled in by managers later.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Client::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(['importer', 'exporter', 'both'])],
        ]);

        // firstOrCreate: if a client with this name+type already exists,
        // return them — no duplicates, no unique constraint violation.
        $client = Client::firstOrCreate(
            ['name' => $validated['name'], 'type' => $validated['type']],
            ['is_active' => true]
        );

        $statusCode = $client->wasRecentlyCreated ? 201 : 200;

        return (new ClientResource($client))
            ->response()
            ->setStatusCode($statusCode);
    }
}
