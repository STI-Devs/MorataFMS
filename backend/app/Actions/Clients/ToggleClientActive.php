<?php

namespace App\Actions\Clients;

use App\Models\Client;

class ToggleClientActive
{
    public function handle(Client $client): Client
    {
        $client->is_active = ! $client->is_active;
        $client->save();
        $client->load('country');

        return $client;
    }
}
