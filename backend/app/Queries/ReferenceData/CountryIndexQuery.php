<?php

namespace App\Queries\ReferenceData;

use App\Enums\CountryType;
use App\Http\Requests\ReferenceData\CountryIndexRequest;
use App\Models\Country;
use App\Support\Cache\ReferenceDataCache;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class CountryIndexQuery
{
    public function handle(CountryIndexRequest $request): Collection
    {
        $includeInactive = $request->includeInactive() && $request->user()->isAdmin();
        $type = $request->typeFilter();

        return Cache::remember(
            ReferenceDataCache::countryKey($includeInactive, $type?->value),
            ReferenceDataCache::ttlSeconds(),
            fn (): Collection => $this->buildQuery($includeInactive, $type)->get(),
        );
    }

    private function buildQuery(bool $includeInactive, ?CountryType $type)
    {
        $query = Country::query()->orderBy('name');

        if (! $includeInactive) {
            $query->active();
        }

        if ($type === CountryType::ImportOrigin) {
            $query->importOrigins();
        } elseif ($type === CountryType::ExportDestination) {
            $query->exportDestinations();
        } elseif ($type === CountryType::Both) {
            $query->where('type', CountryType::Both->value);
        }

        return $query;
    }
}
