<?php

namespace App\Queries\LegacyBatches;

use App\Models\LegacyBatch;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class LegacyBatchIndexQuery
{
    public function handle(Request $request, User $user): LengthAwarePaginator
    {
        $perPage = in_array($request->integer('per_page', 20), [20, 50, 100], true)
            ? $request->integer('per_page', 20)
            : 20;

        return LegacyBatch::query()
            ->visibleTo($user)
            ->with('uploadedBy')
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }
}
