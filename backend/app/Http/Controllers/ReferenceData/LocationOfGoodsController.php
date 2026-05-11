<?php

namespace App\Http\Controllers\ReferenceData;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReferenceData\LocationOfGoodsIndexRequest;
use App\Http\Requests\ReferenceData\StoreLocationOfGoodsRequest;
use App\Http\Requests\ReferenceData\UpdateLocationOfGoodsRequest;
use App\Http\Resources\ReferenceData\LocationOfGoodsResource;
use App\Models\LocationOfGoods;
use App\Orchestrators\ReferenceData\LocationOfGoodsOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LocationOfGoodsController extends Controller
{
    public function __construct(
        private LocationOfGoodsOrchestrator $locationsOfGoods,
    ) {}

    public function index(LocationOfGoodsIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LocationOfGoods::class);

        return LocationOfGoodsResource::collection($this->locationsOfGoods->index($request));
    }

    public function store(StoreLocationOfGoodsRequest $request): JsonResponse
    {
        $this->authorize('create', LocationOfGoods::class);

        return (new LocationOfGoodsResource($this->locationsOfGoods->store($request->validated())))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateLocationOfGoodsRequest $request, LocationOfGoods $locationOfGoods): LocationOfGoodsResource
    {
        $this->authorize('update', $locationOfGoods);

        return new LocationOfGoodsResource($this->locationsOfGoods->update($locationOfGoods, $request->validated()));
    }

    public function toggleActive(LocationOfGoods $locationOfGoods): LocationOfGoodsResource
    {
        $this->authorize('update', $locationOfGoods);

        return new LocationOfGoodsResource($this->locationsOfGoods->toggleActive($locationOfGoods));
    }
}
