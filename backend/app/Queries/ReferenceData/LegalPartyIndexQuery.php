<?php

namespace App\Queries\ReferenceData;

use App\Http\Requests\LegalPartyIndexRequest;
use App\Models\LegalParty;
use Illuminate\Support\Collection;

class LegalPartyIndexQuery
{
    public function handle(LegalPartyIndexRequest $request): Collection
    {
        $query = LegalParty::query()->orderBy('name');

        $search = $request->search();

        if ($search !== null) {
            $query->where('name', 'like', "%{$search}%");
        }

        return $query->limit($request->limitValue())->get();
    }
}
