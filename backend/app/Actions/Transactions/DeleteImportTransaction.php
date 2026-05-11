<?php

namespace App\Actions\Transactions;

use App\Enums\ImportStatus;
use App\Models\ImportTransaction;
use Illuminate\Validation\ValidationException;

class DeleteImportTransaction
{
    public function handle(ImportTransaction $transaction): void
    {
        if ($transaction->status !== ImportStatus::Cancelled) {
            throw ValidationException::withMessages([
                'status' => ['Only cancelled transactions can be deleted.'],
            ]);
        }

        $transaction->delete();
    }
}
