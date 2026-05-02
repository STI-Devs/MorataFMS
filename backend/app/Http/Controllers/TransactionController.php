<?php

namespace App\Http\Controllers;

use App\Actions\Transactions\OverrideTransactionStatus;
use App\Http\Requests\OverrideStatusRequest;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Queries\Transactions\TrackingTransactionQuery;
use App\Queries\Transactions\TransactionOversightIndexQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function __construct(
        private TransactionOversightIndexQuery $transactionOversightIndexQuery,
        private TrackingTransactionQuery $trackingTransactionQuery,
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
     * GET /api/tracking/{referenceId}
     * Resolve a single live-tracking transaction by reference.
     */
    public function showTracking(Request $request, string $referenceId): JsonResponse
    {
        $this->authorize('viewAny', ImportTransaction::class);

        return response()->json($this->trackingTransactionQuery->handle($request, $referenceId));
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
            (string) $validated['status'],
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
            (string) $validated['status'],
            $request->ip(),
        );

        return response()->json([
            'message' => 'Status updated successfully.',
            'status' => $exportTransaction->status,
        ]);
    }
}
