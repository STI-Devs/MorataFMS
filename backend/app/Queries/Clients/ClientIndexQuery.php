<?php

namespace App\Queries\Clients;

use App\Http\Requests\ClientIndexRequest;
use App\Models\Client;
use Illuminate\Support\Collection;

class ClientIndexQuery
{
    public function handle(ClientIndexRequest $request): Collection
    {
        $query = Client::query()
            ->with('country')
            ->orderBy('name');

        if (! $request->user()->isAdmin()) {
            $query->active();
        }

        $type = $request->typeFilter();

        if ($type === 'importer') {
            $query->importers();
        } elseif ($type === 'exporter') {
            $query->exporters();
        }

        $search = $request->search();

        if ($search !== null) {
            $query->where(function ($clientQuery) use ($search): void {
                $clientQuery->where('name', 'like', "%{$search}%")
                    ->orWhere('contact_person', 'like', "%{$search}%")
                    ->orWhere('contact_email', 'like', "%{$search}%");
            });
        }

        return $query->get();
    }
}
