<?php

namespace App\Http\Controllers\ReferenceData;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReferenceData\CountryIndexRequest;
use App\Http\Requests\ReferenceData\StoreCountryRequest;
use App\Http\Requests\ReferenceData\UpdateCountryRequest;
use App\Http\Resources\ReferenceData\CountryResource;
use App\Models\Country;
use App\Orchestrators\ReferenceData\CountryOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CountryController extends Controller
{
    public function __construct(
        private CountryOrchestrator $countries,
    ) {}

    /**
     * GET /api/countries
     * List active countries, optionally filtered by type.
     */
    public function index(CountryIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Country::class);

        return CountryResource::collection($this->countries->index($request));
    }

    public function store(StoreCountryRequest $request): JsonResponse
    {
        $this->authorize('create', Country::class);

        return (new CountryResource($this->countries->store($request->validated())))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateCountryRequest $request, Country $country): CountryResource
    {
        $this->authorize('update', $country);

        return new CountryResource($this->countries->update($country, $request->validated()));
    }

    public function toggleActive(Country $country): CountryResource
    {
        $this->authorize('update', $country);

        return new CountryResource($this->countries->toggleActive($country));
    }
}
