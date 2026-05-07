<?php

namespace App\Queries\ReferenceData;

use App\Http\Requests\ReferenceData\LocationOfGoodsIndexRequest;
use App\Models\LocationOfGoods;
use App\Support\Cache\ReferenceDataCache;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class LocationOfGoodsIndexQuery
{
    public function handle(LocationOfGoodsIndexRequest $request): Collection
    {
        $includeInactive = $request->includeInactive() && $request->user()->isAdmin();

        return Cache::remember(
            ReferenceDataCache::locationOfGoodsKey($includeInactive),
            ReferenceDataCache::ttlSeconds(),
            fn (): Collection => $this->buildQuery($includeInactive)->get(),
        );
    }

    private function buildQuery(bool $includeInactive)
    {
        $query = LocationOfGoods::query()->orderBy('name');

        if (! $includeInactive) {
            $query->active();
        }

        return $query;
    }
}
