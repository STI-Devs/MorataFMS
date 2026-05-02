<?php

namespace App\Actions\Remarks;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;
use App\Support\Transactions\TransactionSyncBroadcaster;
use Illuminate\Validation\ValidationException;

class CreateTransactionRemark
{
    public function __construct(
        private TransactionSyncBroadcaster $transactionSyncBroadcaster,
    ) {}

    public function handle(
        ImportTransaction|ExportTransaction $transaction,
        array $validated,
        User $author,
    ): TransactionRemark {
        if (isset($validated['document_id']) && ! $transaction->documents()->whereKey($validated['document_id'])->exists()) {
            throw ValidationException::withMessages([
                'document_id' => 'The selected document does not belong to this transaction.',
            ]);
        }

        $remark = new TransactionRemark($validated);
        $remark->remarkble_type = get_class($transaction);
        $remark->remarkble_id = $transaction->id;
        $remark->author_id = $author->id;
        $remark->is_resolved = false;
        $remark->save();
        $remark->load(['author:id,name,role', 'document:id,filename,type']);
        $this->transactionSyncBroadcaster->remarkChanged($transaction, $author, 'remark_created');

        return $remark;
    }
}
