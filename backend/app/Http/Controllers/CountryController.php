<?php

namespace App\Http\Controllers;

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

        $query = Country::active()->orderBy('name');

        if ($request->query('type') === 'export_destination') {
            $query->exportDestinations();
        }

        return response()->json(['data' => $query->get(['id', 'name', 'code'])]);
    }
}
