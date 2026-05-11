<?php

namespace App\Orchestrators\Transactions;

use App\Actions\Transactions\CancelImportTransaction;
use App\Actions\Transactions\CreateImportTransaction;
use App\Actions\Transactions\DeleteImportTransaction;
use App\Actions\Transactions\UpdateImportStageApplicability;
use App\Actions\Transactions\UpdateImportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Queries\Transactions\ImportTransactionIndexQuery;
use App\Queries\Transactions\ImportTransactionStatsQuery;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class ImportTransactionOrchestrator
{
    public function __construct(
        private ImportTransactionIndexQuery $indexQuery,
        private ImportTransactionStatsQuery $statsQuery,
        private CreateImportTransaction $createImportTransaction,
        private UpdateImportTransaction $updateImportTransaction,
        private CancelImportTransaction $cancelImportTransaction,
        private UpdateImportStageApplicability $updateImportStageApplicability,
        private DeleteImportTransaction $deleteImportTransaction,
    ) {}

    public function index(Request $request): LengthAwarePaginator
    {
        return $this->indexQuery->handle($request);
    }

    public function store(array $validated, User $user): ImportTransaction
    {
        return $this->createImportTransaction->handle($validated, $user);
    }

    public function update(ImportTransaction $transaction, array $validated, User $user): ImportTransaction
    {
        return $this->updateImportTransaction->handle($transaction, $validated, $user);
    }

    public function stats(User $user): array
    {
        return $this->statsQuery->handle($user);
    }

    public function cancel(ImportTransaction $transaction, string $reason, User $user): ImportTransaction
    {
        return $this->cancelImportTransaction->handle($transaction, $reason, $user);
    }

    public function updateStageApplicability(
        ImportTransaction $transaction,
        string $stage,
        bool $notApplicable,
        User $user,
    ): ImportTransaction {
        return $this->updateImportStageApplicability->handle($transaction, $stage, $notApplicable, $user);
    }

    public function delete(ImportTransaction $transaction): void
    {
        $this->deleteImportTransaction->handle($transaction);
    }
}
