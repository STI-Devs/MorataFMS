<?php

namespace App\Actions\LocationsOfGoods;

use App\Models\LocationOfGoods;
use App\Support\Cache\ReferenceDataCache;

class ToggleLocationOfGoodsActive
{
    public function handle(LocationOfGoods $locationOfGoods): LocationOfGoods
    {
        $locationOfGoods->is_active = ! $locationOfGoods->is_active;
        $locationOfGoods->save();

        ReferenceDataCache::forgetLocationsOfGoods();

        return $locationOfGoods;
    }
}
