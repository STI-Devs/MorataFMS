<?php

namespace App\Actions\Transactions;

use App\Enums\AuditEvent;
use App\Models\AuditLog;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;

class OverrideTransactionStatus
{
    public function handle(
        ImportTransaction|ExportTransaction $transaction,
        User $actor,
        string $status,
        ?string $ipAddress = null,
    ): void {
        $subjectType = $transaction instanceof ImportTransaction ? 'import' : 'export';
        $oldStatus = $transaction->status;

        $transaction->status = $status;
        $transaction->save();

        AuditLog::record(
            event: AuditEvent::StatusChanged,
            description: "{$actor->name} changed {$subjectType} #{$transaction->id} (BL: {$transaction->bl_no}) status from {$oldStatus->value} to {$transaction->status->value}.",
            userId: $actor->id,
            subjectType: $subjectType,
            subjectId: $transaction->id,
            ipAddress: $ipAddress,
        );
    }
}
