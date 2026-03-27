<?php

namespace App\Actions\Transactions;

use App\Enums\AuditEvent;
use App\Models\AuditLog;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ReassignTransaction
{
    public function handle(
        ImportTransaction|ExportTransaction $transaction,
        User $actor,
        int $assignedUserId,
        ?string $ipAddress = null,
    ): void {
        $subjectType = $transaction instanceof ImportTransaction ? 'import' : 'export';
        $transaction->loadMissing('assignedUser:id,name');
        $oldEncoder = $transaction->assignedUser?->name ?? 'None';

        DB::transaction(function () use (
            $transaction,
            $assignedUserId,
            $actor,
            $subjectType,
            $oldEncoder,
            $ipAddress,
        ): void {
            $transaction->assigned_user_id = $assignedUserId;
            $transaction->save();
            $transaction->load('assignedUser:id,name');

            $newEncoder = $transaction->assignedUser?->name ?? 'Unknown';

            AuditLog::record(
                event: AuditEvent::EncoderReassigned,
                description: "{$actor->name} reassigned {$subjectType} #{$transaction->id} (BL: {$transaction->bl_no}) from {$oldEncoder} to {$newEncoder}.",
                userId: $actor->id,
                subjectType: $subjectType,
                subjectId: $transaction->id,
                ipAddress: $ipAddress,
            );
        });
    }
}
