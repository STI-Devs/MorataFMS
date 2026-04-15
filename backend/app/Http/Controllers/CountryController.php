<?php

namespace App\Http\Controllers;

use App\Enums\CountryType;
use App\Http\Requests\StoreCountryRequest;
use App\Http\Requests\UpdateCountryRequest;
use App\Http\Resources\CountryResource;
use App\Models\Country;
use Illuminate\Http\Request;

class CountryController extends Controller
{
    /**
     * GET /api/countries
     * List active countries, optionally filtered by type.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Country::class);

        $query = Country::query()->orderBy('name');

        if (! ($request->boolean('include_inactive') && $request->user()->isAdmin())) {
            $query->active();
        }

        $type = CountryType::tryFrom((string) $request->query('type'));

        if ($type === CountryType::ImportOrigin) {
            $query->importOrigins();
        } elseif ($type === CountryType::ExportDestination) {
            $query->exportDestinations();
        } elseif ($type === CountryType::Both) {
            $query->where('type', CountryType::Both->value);
        }

        return CountryResource::collection($query->get());
    }

    public function store(StoreCountryRequest $request)
    {
        $this->authorize('create', Country::class);

        $country = new Country($request->validated());
        $country->is_active = true;
        $country->save();

        return (new CountryResource($country))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateCountryRequest $request, Country $country)
    {
        $this->authorize('update', $country);

        $country->fill($request->validated());
        $country->save();

        return new CountryResource($country);
    }

    public function toggleActive(Country $country)
    {
        $this->authorize('update', $country);

        $country->is_active = ! $country->is_active;
        $country->save();

        return new CountryResource($country);
    }
}
