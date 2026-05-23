<?php

namespace App\Http\Controllers\Transactions;

use App\Http\Controllers\Controller;
use App\Http\Requests\Transactions\StoreRemarkRequest;
use App\Http\Resources\Transactions\TransactionRemarkResource;
use App\Models\TransactionRemark;
use App\Orchestrators\Transactions\TransactionRemarkOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionRemarkController extends Controller
{
    public function __construct(
        private TransactionRemarkOrchestrator $remarks,
    ) {}

    public function index(Request $request, string $type, string $id): JsonResponse
    {
        $transaction = $this->remarks->resolveTransaction($type, $id);
        $this->remarks->authorizeAccess($request->user(), $transaction);

        return response()->json([
            'data' => TransactionRemarkResource::collection(
                $this->remarks->index($transaction)
            ),
        ]);
    }

    public function store(StoreRemarkRequest $request, string $type, string $id): JsonResponse
    {
        $transaction = $this->remarks->resolveTransaction($type, $id);

        return TransactionRemarkResource::make(
            $this->remarks->store(
                $transaction,
                $request->validated(),
                $request->user(),
            )
        )
            ->response()
            ->setStatusCode(201);
    }

    public function resolve(Request $request, TransactionRemark $remark): JsonResponse
    {
        $this->remarks->authorizeRemarkAccess($request->user(), $remark);

        return response()->json([
            'message' => 'Remark resolved.',
            'data' => TransactionRemarkResource::make(
                $this->remarks->resolve($remark, $request->user())
            ),
        ]);
    }
}
