<?php

namespace App\Queries\Transactions;

use App\Enums\ExportStatus;
use App\Enums\UserRole;
use App\Models\ExportTransaction;
use App\Models\User;
use App\Support\Transactions\ExportStatusWorkflow;

class ExportTransactionStatsQuery
{
    public function handle(User $user): array
    {
        $baseQuery = ExportTransaction::query();

        if (in_array($user->role, [UserRole::Processor, UserRole::Accounting], true)) {
            $baseQuery->relevantToOperationalQueue($user);
        } else {
            $baseQuery->visibleTo($user);
        }

        $inProgress = ExportStatusWorkflow::inProgress();
        $inProgressPlaceholders = implode(',', array_fill(0, count($inProgress), '?'));

        $row = $baseQuery->toBase()
            ->selectRaw(
                'COUNT(*) as total, '.
                'COUNT(CASE WHEN status = ? THEN 1 END) as pending, '.
                "COUNT(CASE WHEN status IN ({$inProgressPlaceholders}) THEN 1 END) as in_progress, ".
                'COUNT(CASE WHEN status = ? THEN 1 END) as completed, '.
                'COUNT(CASE WHEN status = ? THEN 1 END) as cancelled',
                array_merge(
                    [ExportStatus::Pending->value],
                    $inProgress,
                    [ExportStatusWorkflow::completed(), ExportStatus::Cancelled->value],
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
