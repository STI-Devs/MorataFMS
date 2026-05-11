<?php

namespace App\Orchestrators\Transactions;

use App\Actions\Transactions\OverrideTransactionStatus;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Queries\Transactions\TrackingTransactionQuery;
use App\Queries\Transactions\TransactionOversightIndexQuery;
use Illuminate\Http\Request;

class TransactionOrchestrator
{
    public function __construct(
        private TransactionOversightIndexQuery $transactionOversightIndexQuery,
        private TrackingTransactionQuery $trackingTransactionQuery,
        private OverrideTransactionStatus $overrideTransactionStatus,
    ) {}

    public function index(Request $request): array
    {
        return $this->transactionOversightIndexQuery->handle($request);
    }

    public function showTracking(Request $request, string $referenceId): array
    {
        return $this->trackingTransactionQuery->handle($request, $referenceId);
    }

    public function overrideStatus(
        ImportTransaction|ExportTransaction $transaction,
        User $user,
        string $status,
        ?string $ipAddress,
    ): void {
        $this->overrideTransactionStatus->handle($transaction, $user, $status, $ipAddress);
    }
}
