<?php

namespace App\Queries\Notarial;

use App\Http\Requests\Notarial\NotarialBookIndexRequest;
use App\Models\NotarialBook;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NotarialBookIndexQuery
{
    public function handle(NotarialBookIndexRequest $request): LengthAwarePaginator
    {
        $query = NotarialBook::query()
            ->with('createdBy')
            ->withCount(['pageScans', 'legacyFiles'])
            ->orderByDesc('year')
            ->orderByDesc('book_number');

        if (($year = $request->yearValue()) !== null) {
            $query->where('year', $year);
        }

        if (($status = $request->statusValue()) !== null) {
            $query->where('status', $status);
        }

        return $query->paginate($request->perPage());
    }
}
