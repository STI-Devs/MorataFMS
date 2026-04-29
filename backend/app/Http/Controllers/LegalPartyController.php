<?php

namespace App\Http\Controllers;

use App\Http\Resources\LegalPartyResource;
use App\Models\LegalParty;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LegalPartyController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LegalParty::class);

        $query = LegalParty::query()->orderBy('name');

        if ($request->filled('search')) {
            $search = (string) $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $limit = min(max($request->integer('limit', 8), 1), 20);

        return LegalPartyResource::collection($query->limit($limit)->get());
    }
}
