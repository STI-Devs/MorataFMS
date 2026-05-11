<?php

namespace App\Orchestrators\Transactions;

use App\Actions\Remarks\CreateTransactionRemark;
use App\Actions\Remarks\ResolveTransactionRemark;
use App\Models\TransactionRemark;
use App\Models\User;
use App\Queries\Remarks\TransactionRemarkIndexQuery;
use App\Support\Transactions\TransactionRouteResolver;
use Illuminate\Database\Eloquent\Collection;

class TransactionRemarkOrchestrator
{
    public function __construct(
        private CreateTransactionRemark $createTransactionRemark,
        private ResolveTransactionRemark $resolveTransactionRemark,
        private TransactionRemarkIndexQuery $transactionRemarkIndexQuery,
        private TransactionRouteResolver $transactionRouteResolver,
    ) {}

    public function index(User $user, string $type, string $id): Collection
    {
        return $this->transactionRemarkIndexQuery->handle($user, $type, $id);
    }

    public function store(string $type, string $id, array $validated, User $user): TransactionRemark
    {
        $transaction = $this->transactionRouteResolver->resolve($type, $id);

        return $this->createTransactionRemark->handle($transaction, $validated, $user);
    }

    public function resolve(TransactionRemark $remark, User $user): TransactionRemark
    {
        return $this->resolveTransactionRemark->handle($remark, $user);
    }
}
