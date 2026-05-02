<?php

namespace App\Http\Controllers;

use App\Actions\LocationsOfGoods\CreateLocationOfGoods;
use App\Actions\LocationsOfGoods\ToggleLocationOfGoodsActive;
use App\Actions\LocationsOfGoods\UpdateLocationOfGoods;
use App\Http\Requests\LocationOfGoodsIndexRequest;
use App\Http\Requests\StoreLocationOfGoodsRequest;
use App\Http\Requests\UpdateLocationOfGoodsRequest;
use App\Http\Resources\LocationOfGoodsResource;
use App\Models\LocationOfGoods;
use App\Queries\ReferenceData\LocationOfGoodsIndexQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LocationOfGoodsController extends Controller
{
    public function __construct(
        private LocationOfGoodsIndexQuery $locationOfGoodsIndexQuery,
        private CreateLocationOfGoods $createLocationOfGoods,
        private UpdateLocationOfGoods $updateLocationOfGoods,
        private ToggleLocationOfGoodsActive $toggleLocationOfGoodsActive,
    ) {}

    public function index(LocationOfGoodsIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LocationOfGoods::class);

        return LocationOfGoodsResource::collection($this->locationOfGoodsIndexQuery->handle($request));
    }

    public function store(StoreLocationOfGoodsRequest $request): JsonResponse
    {
        $this->authorize('create', LocationOfGoods::class);

        $locationOfGoods = $this->createLocationOfGoods->handle($request->validated());

        return (new LocationOfGoodsResource($locationOfGoods))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateLocationOfGoodsRequest $request, LocationOfGoods $locationOfGoods): LocationOfGoodsResource
    {
        $this->authorize('update', $locationOfGoods);

        $locationOfGoods = $this->updateLocationOfGoods->handle($locationOfGoods, $request->validated());

        return new LocationOfGoodsResource($locationOfGoods);
    }

    public function toggleActive(LocationOfGoods $locationOfGoods): LocationOfGoodsResource
    {
        $this->authorize('update', $locationOfGoods);

        $locationOfGoods = $this->toggleLocationOfGoodsActive->handle($locationOfGoods);

        return new LocationOfGoodsResource($locationOfGoods);
    }
}
