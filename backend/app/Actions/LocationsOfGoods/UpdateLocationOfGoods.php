<?php

namespace App\Actions\LocationsOfGoods;

use App\Models\LocationOfGoods;
use App\Support\Cache\ReferenceDataCache;

class UpdateLocationOfGoods
{
    public function handle(LocationOfGoods $locationOfGoods, array $validated): LocationOfGoods
    {
        $locationOfGoods->fill($validated);
        $locationOfGoods->save();

        ReferenceDataCache::forgetLocationsOfGoods();

        return $locationOfGoods;
    }
}
