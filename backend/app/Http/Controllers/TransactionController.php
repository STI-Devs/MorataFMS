<?php

namespace App\Http\Controllers;

use App\Actions\Transactions\OverrideTransactionStatus;
use App\Enums\ImportStatus;
use App\Http\Requests\OverrideStatusRequest;
use App\Http\Resources\ExportTransactionResource;
use App\Http\Resources\ImportTransactionResource;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Queries\Transactions\TransactionOversightIndexQuery;
use App\Support\Transactions\TransactionSyncBroadcaster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function __construct(
        private TransactionOversightIndexQuery $transactionOversightIndexQuery,
        private OverrideTransactionStatus $overrideTransactionStatus,
        private TransactionSyncBroadcaster $transactionSyncBroadcaster,
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

        $importTransaction = ImportTransaction::query()
            ->visibleTo($request->user())
            ->with(['importer', 'originCountry', 'locationOfGoods', 'stages', 'assignedUser'])
            ->withCount(['remarks as open_remarks_count' => fn ($query) => $query->where('is_resolved', false)])
            ->withCount('documents')
            ->where('customs_ref_no', $referenceId)
            ->whereNotIn('status', [
                ImportStatus::Completed->value,
                ImportStatus::Cancelled->value,
            ])
            ->latest('id')
            ->first();

        if ($importTransaction) {
            return response()->json([
                'data' => [
                    'type' => 'import',
                    'transaction' => (new ImportTransactionResource($importTransaction))->resolve($request),
                ],
            ]);
        }

        $exportQuery = ExportTransaction::query()
            ->visibleTo($request->user())
            ->with(['shipper', 'stages', 'assignedUser', 'destinationCountry'])
            ->withCount(['remarks as open_remarks_count' => fn ($query) => $query->where('is_resolved', false)])
            ->withCount('documents');

        $exportId = $this->parseExportReference($referenceId);

        $exportTransaction = $exportId !== null
            ? (clone $exportQuery)->find($exportId)
            : null;

        if (! $exportTransaction) {
            $exportTransaction = (clone $exportQuery)
                ->where('bl_no', trim($referenceId))
                ->latest('id')
                ->first();
        }

        if (! $exportTransaction || $exportTransaction->status->isTerminal()) {
            abort(404);
        }

        return response()->json([
            'data' => [
                'type' => 'export',
                'transaction' => (new ExportTransactionResource($exportTransaction))->resolve($request),
            ],
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
        $this->transactionSyncBroadcaster->transactionChanged(
            $importTransaction,
            $request->user(),
            'status_changed',
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
        $this->transactionSyncBroadcaster->transactionChanged(
            $exportTransaction,
            $request->user(),
            'status_changed',
        );

        return response()->json([
            'message' => 'Status updated successfully.',
            'status' => $exportTransaction->status,
        ]);
    }

    private function parseExportReference(string $referenceId): ?int
    {
        if (preg_match('/^(?:EXP-)?(\d+)$/i', trim($referenceId), $matches) !== 1) {
            return null;
        }

        return (int) $matches[1];
    }
}
