<?php

namespace App\Support\Transactions;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class TransactionRouteResolver
{
    public function resolve(string $type, int|string $id): ImportTransaction|ExportTransaction
    {
        return match ($type) {
            'import' => ImportTransaction::query()->findOrFail($id),
            'export' => ExportTransaction::query()->findOrFail($id),
            default => throw new NotFoundHttpException('Invalid transaction type.'),
        };
    }
}
