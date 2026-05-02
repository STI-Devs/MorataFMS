<?php

namespace App\Queries\ReferenceData;

use App\Enums\CountryType;
use App\Http\Requests\CountryIndexRequest;
use App\Models\Country;
use Illuminate\Support\Collection;

class CountryIndexQuery
{
    public function handle(CountryIndexRequest $request): Collection
    {
        $query = Country::query()->orderBy('name');

        if (! ($request->includeInactive() && $request->user()->isAdmin())) {
            $query->active();
        }

        $type = $request->typeFilter();

        if ($type === CountryType::ImportOrigin) {
            $query->importOrigins();
        } elseif ($type === CountryType::ExportDestination) {
            $query->exportDestinations();
        } elseif ($type === CountryType::Both) {
            $query->where('type', CountryType::Both->value);
        }

        return $query->get();
    }
}
