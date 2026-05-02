<?php

namespace App\Actions\Countries;

use App\Models\Country;

class CreateCountry
{
    public function handle(array $validated): Country
    {
        $country = new Country($validated);
        $country->is_active = true;
        $country->save();

        return $country;
    }
}
