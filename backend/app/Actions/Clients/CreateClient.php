<?php

namespace App\Actions\Clients;

use App\Models\Client;

class CreateClient
{
    public function handle(array $validated): Client
    {
        $client = new Client($validated);
        $client->is_active = true;
        $client->save();
        $client->load('country');

        return $client;
    }
}
