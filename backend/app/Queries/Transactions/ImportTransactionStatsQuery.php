<?php

namespace App\Queries\Transactions;

use App\Enums\ImportStatus;
use App\Enums\UserRole;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Support\Transactions\ImportStatusWorkflow;

class ImportTransactionStatsQuery
{
    public function handle(User $user): array
    {
        $baseQuery = ImportTransaction::query();

        if (in_array($user->role, [UserRole::Processor, UserRole::Accounting], true)) {
            $baseQuery->relevantToOperationalQueue($user);
        } else {
            $baseQuery->visibleTo($user);
        }

        $inProgress = ImportStatusWorkflow::inProgress();
        $inProgressPlaceholders = implode(',', array_fill(0, count($inProgress), '?'));

        $row = $baseQuery->toBase()
            ->selectRaw(
                'COUNT(*) as total, '.
                'COUNT(CASE WHEN status = ? THEN 1 END) as pending, '.
                "COUNT(CASE WHEN status IN ({$inProgressPlaceholders}) THEN 1 END) as in_progress, ".
                'COUNT(CASE WHEN status = ? THEN 1 END) as completed, '.
                'COUNT(CASE WHEN status = ? THEN 1 END) as cancelled',
                array_merge(
                    [ImportStatus::Pending->value],
                    $inProgress,
                    [ImportStatusWorkflow::completed(), ImportStatus::Cancelled->value],
                ),
            )
            ->first();

        return [
            'total' => (int) ($row->total ?? 0),
            'pending' => (int) ($row->pending ?? 0),
            'in_progress' => (int) ($row->in_progress ?? 0),
            'completed' => (int) ($row->completed ?? 0),
            'cancelled' => (int) ($row->cancelled ?? 0),
        ];
    }
}
