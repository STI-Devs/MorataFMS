<?php

namespace App\Support\Documents;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;

class DocumentableTransactionResolver
{
    /**
     * @param  array{documentable_type: class-string<ImportTransaction|ExportTransaction>, documentable_id: int|string}  $validated
     */
    public function resolveFromValidated(array $validated): ImportTransaction|ExportTransaction
    {
        return $this->resolve(
            $validated['documentable_type'],
            (int) $validated['documentable_id'],
        );
    }

    /**
     * @param  class-string<ImportTransaction|ExportTransaction>  $documentableType
     */
    public function resolve(string $documentableType, int $documentableId): ImportTransaction|ExportTransaction
    {
        return match ($documentableType) {
            ImportTransaction::class => ImportTransaction::findOrFail($documentableId),
            ExportTransaction::class => ExportTransaction::findOrFail($documentableId),
        };
    }
}
