<?php

namespace App\Actions\Countries;

use App\Models\Country;

class ToggleCountryActive
{
    public function handle(Country $country): Country
    {
        $country->is_active = ! $country->is_active;
        $country->save();

        return $country;
    }
}
