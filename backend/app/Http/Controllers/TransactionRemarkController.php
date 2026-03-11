<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRemarkRequest;
use App\Http\Resources\TransactionRemarkResource;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionRemarkController extends Controller
{
    /**
     * Resolve the transaction model from the polymorphic {type}/{id} route.
     */
    private function resolveTransaction(string $type, string $id)
    {
        return match ($type) {
            'import' => ImportTransaction::findOrFail($id),
            'export' => ExportTransaction::findOrFail($id),
            default => abort(404, 'Invalid transaction type.'),
        };
    }

    /**
     * GET /api/transactions/{type}/{id}/remarks
     * List remarks for a transaction. Admin sees all; encoder sees only their assigned.
     */
    public function index(Request $request, string $type, string $id): JsonResponse
    {
        $user = $request->user();
        $transaction = $this->resolveTransaction($type, $id);

        // Encoders can only see remarks on transactions assigned to them
        if (!$user->isAdmin() && $transaction->assigned_user_id !== $user->id) {
            abort(403, 'Unauthorized.');
        }

        $remarks = $transaction->remarks()
            ->with(['author:id,name,role', 'resolver:id,name', 'document:id,filename,type'])
            ->orderByDesc('created_at')
            ->get();

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
        $transaction = $this->resolveTransaction($type, $id);

        $remark = new TransactionRemark($request->validated());
        $remark->remarkble_type = get_class($transaction);
        $remark->remarkble_id = $transaction->id;
        $remark->author_id = $request->user()->id;
        $remark->is_resolved = false;
        $remark->save();

        $remark->load(['author:id,name,role', 'document:id,filename,type']);

        return (TransactionRemarkResource::make($remark))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PATCH /api/remarks/{remark}/resolve
     * Admin or assigned encoder can resolve.
     */
    public function resolve(Request $request, TransactionRemark $remark): JsonResponse
    {
        $user = $request->user();
        $transaction = $remark->remarkble;

        // Only admin or the assigned encoder can resolve
        if (!$user->isAdmin() && $transaction->assigned_user_id !== $user->id) {
            abort(403, 'Unauthorized.');
        }

        if ($remark->is_resolved) {
            return response()->json(['message' => 'Already resolved.'], 422);
        }

        $remark->is_resolved = true;
        $remark->resolved_by = $user->id;
        $remark->resolved_at = now();
        $remark->save();

        $remark->load(['author:id,name,role', 'resolver:id,name', 'document:id,filename,type']);

        return response()->json([
            'message' => 'Remark resolved.',
            'data' => TransactionRemarkResource::make($remark),
        ]);
    }
}
