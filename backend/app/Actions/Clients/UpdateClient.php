<?php

namespace App\Actions\Clients;

use App\Models\Client;

class UpdateClient
{
    public function handle(Client $client, array $validated): Client
    {
        $client->fill($validated);
        $client->save();
        $client->load('country');

        return $client;
    }
}
