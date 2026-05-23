<?php

namespace App\Orchestrators\Transactions;

use App\Actions\Remarks\CreateTransactionRemark;
use App\Actions\Remarks\ResolveTransactionRemark;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;
use App\Queries\Remarks\TransactionRemarkIndexQuery;
use App\Support\Transactions\TransactionRemarkAuthorizer;
use App\Support\Transactions\TransactionRouteResolver;
use Illuminate\Database\Eloquent\Collection;

class TransactionRemarkOrchestrator
{
    public function __construct(
        private CreateTransactionRemark $createTransactionRemark,
        private ResolveTransactionRemark $resolveTransactionRemark,
        private TransactionRemarkIndexQuery $transactionRemarkIndexQuery,
        private TransactionRemarkAuthorizer $transactionRemarkAuthorizer,
        private TransactionRouteResolver $transactionRouteResolver,
    ) {}

    public function resolveTransaction(string $type, string $id): ImportTransaction|ExportTransaction
    {
        return $this->transactionRouteResolver->resolve($type, $id);
    }

    public function authorizeAccess(User $user, ImportTransaction|ExportTransaction $transaction): void
    {
        $this->transactionRemarkAuthorizer->authorizeTransactionAccess($user, $transaction);
    }

    public function authorizeRemarkAccess(User $user, TransactionRemark $remark): void
    {
        $this->transactionRemarkAuthorizer->authorizeRemarkAccess($user, $remark);
    }

    public function index(ImportTransaction|ExportTransaction $transaction): Collection
    {
        return $this->transactionRemarkIndexQuery->handle($transaction);
    }

    public function store(ImportTransaction|ExportTransaction $transaction, array $validated, User $user): TransactionRemark
    {
        return $this->createTransactionRemark->handle($transaction, $validated, $user);
    }

    public function resolve(TransactionRemark $remark, User $user): TransactionRemark
    {
        return $this->resolveTransactionRemark->handle($remark, $user);
    }
}
