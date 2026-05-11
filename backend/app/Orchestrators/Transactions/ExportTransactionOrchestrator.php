<?php

namespace App\Orchestrators\Transactions;

use App\Actions\Transactions\CancelExportTransaction;
use App\Actions\Transactions\CreateExportTransaction;
use App\Actions\Transactions\DeleteExportTransaction;
use App\Actions\Transactions\UpdateExportStageApplicability;
use App\Actions\Transactions\UpdateExportTransaction;
use App\Models\ExportTransaction;
use App\Models\User;
use App\Queries\Transactions\ExportTransactionIndexQuery;
use App\Queries\Transactions\ExportTransactionStatsQuery;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class ExportTransactionOrchestrator
{
    public function __construct(
        private ExportTransactionIndexQuery $indexQuery,
        private ExportTransactionStatsQuery $statsQuery,
        private CreateExportTransaction $createExportTransaction,
        private UpdateExportTransaction $updateExportTransaction,
        private CancelExportTransaction $cancelExportTransaction,
        private UpdateExportStageApplicability $updateExportStageApplicability,
        private DeleteExportTransaction $deleteExportTransaction,
    ) {}

    public function index(Request $request): LengthAwarePaginator
    {
        return $this->indexQuery->handle($request);
    }

    public function store(array $validated, User $user): ExportTransaction
    {
        return $this->createExportTransaction->handle($validated, $user);
    }

    public function update(ExportTransaction $transaction, array $validated, User $user): ExportTransaction
    {
        return $this->updateExportTransaction->handle($transaction, $validated, $user);
    }

    public function stats(User $user): array
    {
        return $this->statsQuery->handle($user);
    }

    public function cancel(ExportTransaction $transaction, string $reason, User $user): ExportTransaction
    {
        return $this->cancelExportTransaction->handle($transaction, $reason, $user);
    }

    public function updateStageApplicability(
        ExportTransaction $transaction,
        string $stage,
        bool $notApplicable,
        User $user,
    ): ExportTransaction {
        return $this->updateExportStageApplicability->handle($transaction, $stage, $notApplicable, $user);
    }

    public function delete(ExportTransaction $transaction): void
    {
        $this->deleteExportTransaction->handle($transaction);
    }
}
