<?php

namespace App\Actions\Countries;

use App\Models\Country;
use App\Support\Cache\ReferenceDataCache;

class UpdateCountry
{
    public function handle(Country $country, array $validated): Country
    {
        $country->fill($validated);
        $country->save();

        ReferenceDataCache::forgetCountries();

        return $country;
    }
}
