<?php

namespace App\Queries\ReferenceData;

use App\Http\Requests\LocationOfGoodsIndexRequest;
use App\Models\LocationOfGoods;
use Illuminate\Support\Collection;

class LocationOfGoodsIndexQuery
{
    public function handle(LocationOfGoodsIndexRequest $request): Collection
    {
        $query = LocationOfGoods::query()->orderBy('name');

        if (! ($request->includeInactive() && $request->user()->isAdmin())) {
            $query->active();
        }

        return $query->get();
    }
}
