<?php

namespace App\Http\Controllers;

use App\Actions\Countries\CreateCountry;
use App\Actions\Countries\ToggleCountryActive;
use App\Actions\Countries\UpdateCountry;
use App\Http\Requests\CountryIndexRequest;
use App\Http\Requests\StoreCountryRequest;
use App\Http\Requests\UpdateCountryRequest;
use App\Http\Resources\CountryResource;
use App\Models\Country;
use App\Queries\ReferenceData\CountryIndexQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CountryController extends Controller
{
    public function __construct(
        private CountryIndexQuery $countryIndexQuery,
        private CreateCountry $createCountry,
        private UpdateCountry $updateCountry,
        private ToggleCountryActive $toggleCountryActive,
    ) {}

    /**
     * GET /api/countries
     * List active countries, optionally filtered by type.
     */
    public function index(CountryIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Country::class);

        return CountryResource::collection($this->countryIndexQuery->handle($request));
    }

    public function store(StoreCountryRequest $request): JsonResponse
    {
        $this->authorize('create', Country::class);

        $country = $this->createCountry->handle($request->validated());

        return (new CountryResource($country))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateCountryRequest $request, Country $country): CountryResource
    {
        $this->authorize('update', $country);

        $country = $this->updateCountry->handle($country, $request->validated());

        return new CountryResource($country);
    }

    public function toggleActive(Country $country): CountryResource
    {
        $this->authorize('update', $country);

        $country = $this->toggleCountryActive->handle($country);

        return new CountryResource($country);
    }
}
