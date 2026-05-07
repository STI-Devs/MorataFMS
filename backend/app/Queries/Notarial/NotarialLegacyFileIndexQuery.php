<?php

namespace App\Queries\Notarial;

use App\Models\NotarialBook;
use Illuminate\Database\Eloquent\Collection;

class NotarialLegacyFileIndexQuery
{
    public function handle(NotarialBook $book): Collection
    {
        return $book->legacyFiles()
            ->with('uploadedBy')
            ->latest('created_at')
            ->get();
    }
}
