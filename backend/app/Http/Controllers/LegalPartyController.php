<?php

namespace App\Http\Controllers;

use App\Http\Requests\LegalPartyIndexRequest;
use App\Http\Resources\LegalPartyResource;
use App\Models\LegalParty;
use App\Queries\ReferenceData\LegalPartyIndexQuery;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LegalPartyController extends Controller
{
    public function __construct(
        private LegalPartyIndexQuery $legalPartyIndexQuery,
    ) {}

    public function index(LegalPartyIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LegalParty::class);

        return LegalPartyResource::collection($this->legalPartyIndexQuery->handle($request));
    }
}
