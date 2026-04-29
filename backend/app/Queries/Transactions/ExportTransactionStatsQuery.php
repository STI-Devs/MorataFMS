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

        return [
            'total' => (clone $baseQuery)->count(),
            'pending' => (clone $baseQuery)->where('status', ExportStatus::Pending->value)->count(),
            'in_progress' => (clone $baseQuery)->whereIn('status', ExportStatusWorkflow::inProgress())->count(),
            'completed' => (clone $baseQuery)->where('status', ExportStatusWorkflow::completed())->count(),
            'cancelled' => (clone $baseQuery)->where('status', ExportStatus::Cancelled->value)->count(),
        ];
    }
}
