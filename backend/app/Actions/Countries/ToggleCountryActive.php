<?php

namespace App\Actions\Countries;

use App\Models\Country;
use App\Support\Cache\ReferenceDataCache;

class ToggleCountryActive
{
    public function handle(Country $country): Country
    {
        $country->is_active = ! $country->is_active;
        $country->save();

        ReferenceDataCache::forgetCountries();

        return $country;
    }
}
