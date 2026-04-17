<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLocationOfGoodsRequest;
use App\Http\Requests\UpdateLocationOfGoodsRequest;
use App\Http\Resources\LocationOfGoodsResource;
use App\Models\LocationOfGoods;
use Illuminate\Http\Request;

class LocationOfGoodsController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', LocationOfGoods::class);

        $query = LocationOfGoods::query()->orderBy('name');

        if (! ($request->boolean('include_inactive') && $request->user()->isAdmin())) {
            $query->active();
        }

        return LocationOfGoodsResource::collection($query->get());
    }

    public function store(StoreLocationOfGoodsRequest $request)
    {
        $this->authorize('create', LocationOfGoods::class);

        $locationOfGoods = new LocationOfGoods($request->validated());
        $locationOfGoods->is_active = true;
        $locationOfGoods->save();

        return (new LocationOfGoodsResource($locationOfGoods))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateLocationOfGoodsRequest $request, LocationOfGoods $locationOfGoods)
    {
        $this->authorize('update', $locationOfGoods);

        $locationOfGoods->fill($request->validated());
        $locationOfGoods->save();

        return new LocationOfGoodsResource($locationOfGoods);
    }

    public function toggleActive(LocationOfGoods $locationOfGoods)
    {
        $this->authorize('update', $locationOfGoods);

        $locationOfGoods->is_active = ! $locationOfGoods->is_active;
        $locationOfGoods->save();

        return new LocationOfGoodsResource($locationOfGoods);
    }
}
