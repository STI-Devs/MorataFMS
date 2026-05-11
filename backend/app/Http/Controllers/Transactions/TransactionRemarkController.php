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

    /**
     * GET /api/transactions/{type}/{id}/remarks
     * List remarks for a transaction. Admin sees all; encoder sees only their assigned.
     */
    public function index(Request $request, string $type, string $id): JsonResponse
    {
        return response()->json([
            'data' => TransactionRemarkResource::collection(
                $this->remarks->index($request->user(), $type, $id)
            ),
        ]);
    }

    /**
     * POST /api/transactions/{type}/{id}/remarks
     * Create a remark on a transaction (admin only — enforced by StoreRemarkRequest).
     */
    public function store(StoreRemarkRequest $request, string $type, string $id): JsonResponse
    {
        return TransactionRemarkResource::make(
            $this->remarks->store(
                $type,
                $id,
                $request->validated(),
                $request->user(),
            )
        )
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PATCH /api/remarks/{remark}/resolve
     * Admin or assigned encoder can resolve.
     */
    public function resolve(Request $request, TransactionRemark $remark): JsonResponse
    {
        return response()->json([
            'message' => 'Remark resolved.',
            'data' => TransactionRemarkResource::make(
                $this->remarks->resolve($remark, $request->user())
            ),
        ]);
    }
}
