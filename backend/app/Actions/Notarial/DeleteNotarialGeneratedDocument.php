<?php

namespace App\Actions\Notarial;

use App\Models\NotarialGeneratedDocument;
use Illuminate\Support\Facades\Storage;

class DeleteNotarialGeneratedDocument
{
    public function handle(NotarialGeneratedDocument $document): void
    {
        if ($document->path) {
            $disk = Storage::disk($document->disk ?: config('filesystems.default', 'local'));

            if ($disk->exists($document->path)) {
                $disk->delete($document->path);
            }
        }

        $document->delete();
    }
}
