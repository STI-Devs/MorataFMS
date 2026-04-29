<?php

namespace App\Queries\Documents;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class DocumentIndexQuery
{
    public function handle(Request $request): Collection
    {
        $query = Document::query()
            ->visibleTo($request->user())
            ->with('uploadedBy');

        if ($request->has('documentable_type') && $request->has('documentable_id')) {
            $query->where('documentable_type', $request->input('documentable_type'))
                ->where('documentable_id', $request->input('documentable_id'));
        }

        return $query->orderBy('created_at', 'desc')->get();
    }
}
