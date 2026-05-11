<?php

namespace App\Actions\Transactions;

use App\Enums\ExportStatus;
use App\Models\ExportTransaction;
use Illuminate\Validation\ValidationException;

class DeleteExportTransaction
{
    public function handle(ExportTransaction $transaction): void
    {
        if ($transaction->status !== ExportStatus::Cancelled) {
            throw ValidationException::withMessages([
                'status' => ['Only cancelled transactions can be deleted.'],
            ]);
        }

        $transaction->delete();
    }
}
