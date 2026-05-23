<?php

namespace App\Support\Transactions;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;

class TransactionRemarkAuthorizer
{
    public function authorizeTransactionAccess(
        User $user,
        ImportTransaction|ExportTransaction $transaction,
    ): void {
        if (! $user->isAdmin() && $transaction->assigned_user_id !== $user->id) {
            abort(403, 'Unauthorized.');
        }
    }

    public function authorizeRemarkAccess(User $user, TransactionRemark $remark): void
    {
        $transaction = $remark->remarkble;

        if (! ($transaction instanceof ImportTransaction || $transaction instanceof ExportTransaction)) {
            abort(404, 'Transaction remark not found.');
        }

        $this->authorizeTransactionAccess($user, $transaction);
    }
}
