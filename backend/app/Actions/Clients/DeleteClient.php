<?php

namespace App\Actions\Clients;

use App\Models\Client;

class DeleteClient
{
    public function handle(Client $client): void
    {
        $client->delete();
    }
}
