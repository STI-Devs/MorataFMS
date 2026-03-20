<?php

namespace App\Http\Controllers;

use App\Actions\Transactions\OverrideTransactionStatus;
use App\Actions\Transactions\ReassignTransaction;
use App\Http\Requests\AssignTransactionRequest;
use App\Http\Requests\OverrideStatusRequest;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Queries\Transactions\TransactionOversightIndexQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function __construct(
        private TransactionOversightIndexQuery $transactionOversightIndexQuery,
        private ReassignTransaction $reassignTransaction,
        private OverrideTransactionStatus $overrideTransactionStatus,
    ) {}

    /**
     * GET /api/transactions
     * Combined list of imports + exports for admin oversight.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        return response()->json($this->transactionOversightIndexQuery->handle($request));
    }

    /**
     * GET /api/transactions/encoders
     */
    public function encoders(Request $request): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        $users = User::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return response()->json(['data' => $users]);
    }

    /**
     * PATCH /api/transactions/import/{importTransaction}/reassign
     */
    public function reassignImport(AssignTransactionRequest $request, ImportTransaction $importTransaction): JsonResponse
    {
        $this->authorize('transactions.reassign');

        $validated = $request->validated();
        $this->reassignTransaction->handle(
            $importTransaction,
            $request->user(),
            $validated['assigned_user_id'],
            $request->ip(),
        );

        return response()->json([
            'message' => 'Encoder reassigned successfully.',
            'assigned_to' => $importTransaction->assignedUser?->name,
            'assigned_user_id' => $importTransaction->assigned_user_id,
        ]);
    }

    /**
     * PATCH /api/transactions/export/{exportTransaction}/reassign
     */
    public function reassignExport(AssignTransactionRequest $request, ExportTransaction $exportTransaction): JsonResponse
    {
        $this->authorize('transactions.reassign');

        $validated = $request->validated();
        $this->reassignTransaction->handle(
            $exportTransaction,
            $request->user(),
            $validated['assigned_user_id'],
            $request->ip(),
        );

        return response()->json([
            'message' => 'Encoder reassigned successfully.',
            'assigned_to' => $exportTransaction->assignedUser?->name,
            'assigned_user_id' => $exportTransaction->assigned_user_id,
        ]);
    }

    /**
     * PATCH /api/transactions/import/{importTransaction}/status
     */
    public function overrideImportStatus(OverrideStatusRequest $request, ImportTransaction $importTransaction): JsonResponse
    {
        $this->authorize('transactions.overrideStatus');

        $validated = $request->validated();
        $this->overrideTransactionStatus->handle(
            $importTransaction,
            $request->user(),
            $validated['status'],
            $request->ip(),
        );

        return response()->json([
            'message' => 'Status updated successfully.',
            'status' => $importTransaction->status,
        ]);
    }

    /**
     * PATCH /api/transactions/export/{exportTransaction}/status
     */
    public function overrideExportStatus(OverrideStatusRequest $request, ExportTransaction $exportTransaction): JsonResponse
    {
        $this->authorize('transactions.overrideStatus');

        $validated = $request->validated();
        $this->overrideTransactionStatus->handle(
            $exportTransaction,
            $request->user(),
            $validated['status'],
            $request->ip(),
        );

        return response()->json([
            'message' => 'Status updated successfully.',
            'status' => $exportTransaction->status,
        ]);
    }
}
