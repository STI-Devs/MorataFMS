<?php

namespace App\Orchestrators\ReferenceData;

use App\Actions\Countries\CreateCountry;
use App\Actions\Countries\ToggleCountryActive;
use App\Actions\Countries\UpdateCountry;
use App\Http\Requests\ReferenceData\CountryIndexRequest;
use App\Models\Country;
use App\Queries\ReferenceData\CountryIndexQuery;
use Illuminate\Support\Collection;

class CountryOrchestrator
{
    public function __construct(
        private CountryIndexQuery $countryIndexQuery,
        private CreateCountry $createCountry,
        private UpdateCountry $updateCountry,
        private ToggleCountryActive $toggleCountryActive,
    ) {}

    public function index(CountryIndexRequest $request): Collection
    {
        return $this->countryIndexQuery->handle($request);
    }

    public function store(array $validated): Country
    {
        return $this->createCountry->handle($validated);
    }

    public function update(Country $country, array $validated): Country
    {
        return $this->updateCountry->handle($country, $validated);
    }

    public function toggleActive(Country $country): Country
    {
        return $this->toggleCountryActive->handle($country);
    }
}
