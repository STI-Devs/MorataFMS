<?php

namespace App\Orchestrators\ReferenceData;

use App\Actions\LocationsOfGoods\CreateLocationOfGoods;
use App\Actions\LocationsOfGoods\ToggleLocationOfGoodsActive;
use App\Actions\LocationsOfGoods\UpdateLocationOfGoods;
use App\Http\Requests\ReferenceData\LocationOfGoodsIndexRequest;
use App\Models\LocationOfGoods;
use App\Queries\ReferenceData\LocationOfGoodsIndexQuery;
use Illuminate\Support\Collection;

class LocationOfGoodsOrchestrator
{
    public function __construct(
        private LocationOfGoodsIndexQuery $locationOfGoodsIndexQuery,
        private CreateLocationOfGoods $createLocationOfGoods,
        private UpdateLocationOfGoods $updateLocationOfGoods,
        private ToggleLocationOfGoodsActive $toggleLocationOfGoodsActive,
    ) {}

    public function index(LocationOfGoodsIndexRequest $request): Collection
    {
        return $this->locationOfGoodsIndexQuery->handle($request);
    }

    public function store(array $validated): LocationOfGoods
    {
        return $this->createLocationOfGoods->handle($validated);
    }

    public function update(LocationOfGoods $locationOfGoods, array $validated): LocationOfGoods
    {
        return $this->updateLocationOfGoods->handle($locationOfGoods, $validated);
    }

    public function toggleActive(LocationOfGoods $locationOfGoods): LocationOfGoods
    {
        return $this->toggleLocationOfGoodsActive->handle($locationOfGoods);
    }
}
