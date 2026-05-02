<?php

namespace App\Actions\LocationsOfGoods;

use App\Models\LocationOfGoods;

class CreateLocationOfGoods
{
    public function handle(array $validated): LocationOfGoods
    {
        $locationOfGoods = new LocationOfGoods($validated);
        $locationOfGoods->is_active = true;
        $locationOfGoods->save();

        return $locationOfGoods;
    }
}
