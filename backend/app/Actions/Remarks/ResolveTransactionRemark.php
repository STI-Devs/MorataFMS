<?php

namespace App\Actions\Remarks;

use App\Models\TransactionRemark;
use App\Models\User;
use App\Support\Transactions\TransactionSyncBroadcaster;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ResolveTransactionRemark
{
    public function __construct(
        private TransactionSyncBroadcaster $transactionSyncBroadcaster,
    ) {}

    public function handle(TransactionRemark $remark, User $user): TransactionRemark
    {
        $transaction = $remark->remarkble;

        if (! $user->isAdmin() && $transaction->assigned_user_id !== $user->id) {
            throw new HttpException(403, 'Unauthorized.');
        }

        if ($remark->is_resolved) {
            throw new HttpException(422, 'Already resolved.');
        }

        $remark->is_resolved = true;
        $remark->resolved_by = $user->id;
        $remark->setAttribute('resolved_at', now());
        $remark->save();
        $remark->load(['author:id,name,role', 'resolver:id,name', 'document:id,filename,type']);

        $this->transactionSyncBroadcaster->remarkChanged($transaction, $user, 'remark_resolved');

        return $remark;
    }
}
