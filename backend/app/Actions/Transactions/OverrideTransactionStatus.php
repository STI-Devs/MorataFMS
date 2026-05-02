<?php

namespace App\Actions\Transactions;

use App\Enums\AuditEvent;
use App\Enums\StageStatus;
use App\Models\AuditLog;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Support\Transactions\ExportStatusWorkflow;
use App\Support\Transactions\ImportStatusWorkflow;
use App\Support\Transactions\TransactionSyncBroadcaster;
use Illuminate\Support\Facades\DB;

class OverrideTransactionStatus
{
    public function __construct(
        private TransactionSyncBroadcaster $transactionSyncBroadcaster,
    ) {}

    public function handle(
        ImportTransaction|ExportTransaction $transaction,
        User $actor,
        string $status,
        ?string $ipAddress = null,
    ): void {
        $subjectType = $transaction instanceof ImportTransaction ? 'import' : 'export';
        $oldStatus = $transaction->status;

        DB::transaction(function () use (
            $transaction,
            $status,
            $actor,
            $subjectType,
            $oldStatus,
            $ipAddress,
        ): void {
            $transaction->status = $status;
            $transaction->save();
            $this->syncCompletionStage($transaction, $actor, $status);

            AuditLog::record(
                event: AuditEvent::StatusChanged,
                description: "{$actor->name} changed {$subjectType} #{$transaction->id} (BL: {$transaction->bl_no}) status from {$oldStatus->value} to {$transaction->status->value}.",
                userId: $actor->id,
                subjectType: $subjectType,
                subjectId: $transaction->id,
                ipAddress: $ipAddress,
            );
        });

        $this->transactionSyncBroadcaster->transactionChanged(
            $transaction,
            $actor,
            'status_changed',
        );
    }

    private function syncCompletionStage(
        ImportTransaction|ExportTransaction $transaction,
        User $actor,
        string $status,
    ): void {
        if ($transaction instanceof ImportTransaction && $status === ImportStatusWorkflow::completed()) {
            $transaction->loadMissing('stages');

            if ($transaction->stages && $transaction->stages->billing_completed_at === null) {
                $transaction->stages->update([
                    'billing_status' => StageStatus::Completed->value,
                    'billing_completed_at' => now(),
                    'billing_completed_by' => $actor->id,
                ]);
            }

            return;
        }

        if ($transaction instanceof ExportTransaction && $status === ExportStatusWorkflow::completed()) {
            $transaction->loadMissing('stages');

            if ($transaction->stages && $transaction->stages->billing_completed_at === null) {
                $transaction->stages->update([
                    'billing_status' => StageStatus::Completed->value,
                    'billing_completed_at' => now(),
                    'billing_completed_by' => $actor->id,
                ]);
            }
        }
    }
}
