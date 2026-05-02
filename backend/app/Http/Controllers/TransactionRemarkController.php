<?php

namespace App\Http\Controllers;

use App\Actions\Remarks\CreateTransactionRemark;
use App\Actions\Remarks\ResolveTransactionRemark;
use App\Http\Requests\StoreRemarkRequest;
use App\Http\Resources\TransactionRemarkResource;
use App\Models\TransactionRemark;
use App\Queries\Remarks\TransactionRemarkIndexQuery;
use App\Support\Transactions\TransactionRouteResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionRemarkController extends Controller
{
    public function __construct(
        private CreateTransactionRemark $createTransactionRemark,
        private ResolveTransactionRemark $resolveTransactionRemark,
        private TransactionRemarkIndexQuery $transactionRemarkIndexQuery,
        private TransactionRouteResolver $transactionRouteResolver,
    ) {}

    /**
     * GET /api/transactions/{type}/{id}/remarks
     * List remarks for a transaction. Admin sees all; encoder sees only their assigned.
     */
    public function index(Request $request, string $type, string $id): JsonResponse
    {
        $remarks = $this->transactionRemarkIndexQuery->handle($request->user(), $type, $id);

        return response()->json([
            'data' => TransactionRemarkResource::collection($remarks),
        ]);
    }

    /**
     * POST /api/transactions/{type}/{id}/remarks
     * Create a remark on a transaction (admin only — enforced by StoreRemarkRequest).
     */
    public function store(StoreRemarkRequest $request, string $type, string $id): JsonResponse
    {
        $transaction = $this->transactionRouteResolver->resolve($type, $id);
        $remark = $this->createTransactionRemark->handle(
            $transaction,
            $request->validated(),
            $request->user(),
        );

        return TransactionRemarkResource::make($remark)
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PATCH /api/remarks/{remark}/resolve
     * Admin or assigned encoder can resolve.
     */
    public function resolve(Request $request, TransactionRemark $remark): JsonResponse
    {
        $remark = $this->resolveTransactionRemark->handle($remark, $request->user());

        return response()->json([
            'message' => 'Remark resolved.',
            'data' => TransactionRemarkResource::make($remark),
        ]);
    }
}
