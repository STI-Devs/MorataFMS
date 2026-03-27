<?php

namespace App\Http\Controllers;

use App\Actions\Transactions\OverrideTransactionStatus;
use App\Actions\Transactions\ReassignTransaction;
use App\Enums\ImportStatus;
use App\Http\Requests\AssignTransactionRequest;
use App\Http\Requests\OverrideStatusRequest;
use App\Http\Resources\ExportTransactionResource;
use App\Http\Resources\ImportTransactionResource;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Queries\Transactions\TransactionOversightIndexQuery;
use App\Support\Transactions\TransactionSyncBroadcaster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function __construct(
        private TransactionOversightIndexQuery $transactionOversightIndexQuery,
        private ReassignTransaction $reassignTransaction,
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
            ->with(['importer', 'originCountry', 'stages', 'assignedUser'])
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

        $exportId = $this->parseExportReference($referenceId);

        if ($exportId === null) {
            abort(404);
        }

        $exportTransaction = ExportTransaction::query()
            ->visibleTo($request->user())
            ->with(['shipper', 'stages', 'assignedUser', 'destinationCountry'])
            ->withCount(['remarks as open_remarks_count' => fn ($query) => $query->where('is_resolved', false)])
            ->withCount('documents')
            ->find($exportId);

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
        $previousAssignedUserId = $importTransaction->assigned_user_id;
        $this->reassignTransaction->handle(
            $importTransaction,
            $request->user(),
            $validated['assigned_user_id'],
            $request->ip(),
        );
        $this->transactionSyncBroadcaster->transactionChanged(
            $importTransaction,
            $request->user(),
            'reassigned',
            $previousAssignedUserId,
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
        $previousAssignedUserId = $exportTransaction->assigned_user_id;
        $this->reassignTransaction->handle(
            $exportTransaction,
            $request->user(),
            $validated['assigned_user_id'],
            $request->ip(),
        );
        $this->transactionSyncBroadcaster->transactionChanged(
            $exportTransaction,
            $request->user(),
            'reassigned',
            $previousAssignedUserId,
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
