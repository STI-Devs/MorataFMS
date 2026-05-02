<?php

namespace App\Actions\LocationsOfGoods;

use App\Models\LocationOfGoods;

class UpdateLocationOfGoods
{
    public function handle(LocationOfGoods $locationOfGoods, array $validated): LocationOfGoods
    {
        $locationOfGoods->fill($validated);
        $locationOfGoods->save();

        return $locationOfGoods;
    }
}
