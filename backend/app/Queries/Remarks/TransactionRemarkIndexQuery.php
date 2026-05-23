<?php

namespace App\Queries\Remarks;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Illuminate\Database\Eloquent\Collection;

class TransactionRemarkIndexQuery
{
    public function handle(ImportTransaction|ExportTransaction $transaction): Collection
    {
        return $transaction->remarks()
            ->with(['author:id,name,role', 'resolver:id,name', 'document:id,filename,type'])
            ->orderByDesc('created_at')
            ->get();
    }
}
