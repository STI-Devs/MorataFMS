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

        return [
            'total' => (clone $baseQuery)->count(),
            'pending' => (clone $baseQuery)->where('status', ImportStatus::Pending->value)->count(),
            'in_progress' => (clone $baseQuery)->whereIn('status', ImportStatusWorkflow::inProgress())->count(),
            'completed' => (clone $baseQuery)->where('status', ImportStatusWorkflow::completed())->count(),
            'cancelled' => (clone $baseQuery)->where('status', ImportStatus::Cancelled->value)->count(),
        ];
    }
}
