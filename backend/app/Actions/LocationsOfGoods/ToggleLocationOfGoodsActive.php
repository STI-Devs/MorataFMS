<?php

namespace App\Actions\LocationsOfGoods;

use App\Models\LocationOfGoods;

class ToggleLocationOfGoodsActive
{
    public function handle(LocationOfGoods $locationOfGoods): LocationOfGoods
    {
        $locationOfGoods->is_active = ! $locationOfGoods->is_active;
        $locationOfGoods->save();

        return $locationOfGoods;
    }
}
