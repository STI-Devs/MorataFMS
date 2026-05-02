<?php

namespace App\Queries\Remarks;

use App\Models\User;
use App\Support\Transactions\TransactionRouteResolver;
use Illuminate\Database\Eloquent\Collection;
use Symfony\Component\HttpKernel\Exception\HttpException;

class TransactionRemarkIndexQuery
{
    public function __construct(
        private TransactionRouteResolver $transactionRouteResolver,
    ) {}

    public function handle(User $user, string $type, string $id): Collection
    {
        $transaction = $this->transactionRouteResolver->resolve($type, $id);

        if (! $user->isAdmin() && $transaction->assigned_user_id !== $user->id) {
            throw new HttpException(403, 'Unauthorized.');
        }

        return $transaction->remarks()
            ->with(['author:id,name,role', 'resolver:id,name', 'document:id,filename,type'])
            ->orderByDesc('created_at')
            ->get();
    }
}
