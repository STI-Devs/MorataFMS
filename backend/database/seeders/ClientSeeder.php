<?php

namespace Database\Seeders;

use App\Models\Client;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    public function run(): void
    {
        $importers = [
            'DOLE PHILIPPINES INC.',
            'ECO-EDGE HOME INTERIORS & SUPPLIES',
            'ECO STEEL ROLLFORMING INDUSTRY INC.',
            'BUILD NEXT DISTRIBUTORS INC',
            'AKTIV MULTI TRADING CO. PHILS. INC.',
            'NJC MARKETING CORP.',
            'ADVENTIST DEVELOPMENT AND RELIEF AGENCY INC.',
            'CI PHILIPPINES INC',
            'PHILIPPINE BIBLE SOCIETY INC',
            'KIAPAT INC.',
            'ZJM TRADING CORP.',
        ];

        foreach ($importers as $name) {
            Client::firstOrCreate(
                ['name' => $name],
                [
                    'type' => 'importer',
                    'is_active' => true,
                ]
            );
        }
    }
}
