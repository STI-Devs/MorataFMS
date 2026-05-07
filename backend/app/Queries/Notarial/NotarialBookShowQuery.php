<?php

namespace App\Queries\Notarial;

use App\Models\NotarialBook;

class NotarialBookShowQuery
{
    public function handle(NotarialBook $book): NotarialBook
    {
        return $book->load('createdBy')->loadCount(['pageScans', 'legacyFiles']);
    }
}
