<?php

namespace App\Queries\Notarial;

use App\Models\NotarialBook;
use Illuminate\Database\Eloquent\Collection;

class NotarialPageScanIndexQuery
{
    public function handle(NotarialBook $book): Collection
    {
        return $book->pageScans()
            ->with('uploadedBy')
            ->orderBy('page_start')
            ->get();
    }
}
