<?php

namespace App\Actions\Countries;

use App\Models\Country;

class UpdateCountry
{
    public function handle(Country $country, array $validated): Country
    {
        $country->fill($validated);
        $country->save();

        return $country;
    }
}
