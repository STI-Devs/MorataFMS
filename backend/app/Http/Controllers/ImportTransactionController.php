<?php

namespace App\Http\Controllers;

use App\Enums\ImportStatus;
use App\Enums\UserRole;
use App\Http\Requests\CancelTransactionRequest;
use App\Http\Requests\StoreImportTransactionRequest;
use App\Http\Requests\UpdateImportStageApplicabilityRequest;
use App\Http\Requests\UpdateImportTransactionRequest;
use App\Http\Resources\ImportTransactionResource;
use App\Models\ImportTransaction;
use App\Support\Transactions\ImportStatusWorkflow;
use App\Support\Transactions\TransactionSyncBroadcaster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImportTransactionController extends Controller
{
    public function __construct(private TransactionSyncBroadcaster $transactionSyncBroadcaster) {}

    /**
     * GET /api/import-transactions
     * Paginated list with optional search and filter.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', ImportTransaction::class);

        $user = $request->user();

        $query = ImportTransaction::query()
            ->with(['importer', 'originCountry', 'locationOfGoods', 'stages', 'assignedUser'])
            ->withCount(['remarks as open_remarks_count' => fn ($q) => $q->where('is_resolved', false)])
            ->withCount('documents');

        if (in_array($user->role, [UserRole::Processor, UserRole::Accounting], true)) {
            if ($request->query('operational_scope') === 'workspace') {
                $query->relevantToOperationalWorkspace($user);
            } else {
                $query->relevantToOperationalQueue($user);
            }
        } else {
            $query->visibleTo($user);
        }

        // Search by customs ref or BL number
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('customs_ref_no', 'like', "%{$search}%")
                    ->orWhere('bl_no', 'like', "%{$search}%")
                    ->orWhereHas('importer', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by status
        if ($status = $request->query('status')) {
            $statuses = ImportStatusWorkflow::filterStatuses($status);
            count($statuses) === 1
                ? $query->where('status', $statuses[0])
                : $query->whereIn('status', $statuses);
        }

        // Exclude statuses (comma-separated) — used by tracking to hide completed/cancelled
        if ($exclude = $request->query('exclude_statuses')) {
            $query->whereNotIn('status', ImportStatusWorkflow::normalizeList($exclude));
        }

        // Filter by selective color
        if ($color = $request->query('selective_color')) {
            $query->where('selective_color', $color);
        }

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1) {
            $perPage = 1;
        }
        if ($perPage > 500) {
            $perPage = 500;
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return ImportTransactionResource::collection($transactions);
    }

    /**
     * POST /api/import-transactions
     * Create a new import transaction.
     */
    public function store(StoreImportTransactionRequest $request)
    {
        $this->authorize('create', ImportTransaction::class);

        $transaction = new ImportTransaction($request->validated());
        $transaction->assigned_user_id = $request->user()->id;
        $transaction->status = ImportStatus::Pending;
        $transaction->save();

        $transaction->load(['importer', 'originCountry', 'locationOfGoods', 'stages', 'assignedUser']);
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $request->user(), 'created');

        return (new ImportTransactionResource($transaction))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT/PATCH /api/import-transactions/{import_transaction}
     * Update an existing import transaction.
     */
    public function update(UpdateImportTransactionRequest $request, ImportTransaction $import_transaction)
    {
        $this->authorize('update', $import_transaction);

        $data = $request->validated();

        $import_transaction->update($data);

        $import_transaction->load(['importer', 'originCountry', 'locationOfGoods', 'stages', 'assignedUser']);
        $this->transactionSyncBroadcaster->transactionChanged($import_transaction, $request->user(), 'updated');

        return new ImportTransactionResource($import_transaction);
    }

    /**
     * GET /api/import-transactions/stats
     * Returns total status counts across all records.
     */
    public function stats()
    {
        $this->authorize('viewAny', ImportTransaction::class);

        $user = request()->user();
        $baseQuery = ImportTransaction::query();

        if (in_array($user->role, [UserRole::Processor, UserRole::Accounting], true)) {
            $baseQuery->relevantToOperationalQueue($user);
        } else {
            $baseQuery->visibleTo($user);
        }

        $counts = [
            'total' => (clone $baseQuery)->count(),
            'pending' => (clone $baseQuery)->where('status', ImportStatus::Pending->value)->count(),
            'in_progress' => (clone $baseQuery)->whereIn('status', ImportStatusWorkflow::inProgress())->count(),
            'completed' => (clone $baseQuery)->where('status', ImportStatusWorkflow::completed())->count(),
            'cancelled' => (clone $baseQuery)->where('status', ImportStatus::Cancelled->value)->count(),
        ];

        return response()->json(['data' => $counts]);
    }

    /**
     * PATCH /api/import-transactions/{import_transaction}/cancel
     * Cancel an import transaction with a reason.
     */
    public function cancel(CancelTransactionRequest $request, ImportTransaction $import_transaction)
    {
        $this->authorize('update', $import_transaction);

        if (! ImportStatusWorkflow::isCancellable($import_transaction->status)) {
            return response()->json([
                'message' => 'Only active transactions can be cancelled.',
            ], 422);
        }

        $import_transaction->status = ImportStatus::Cancelled;
        $import_transaction->notes = $request->validated()['reason'];
        $import_transaction->save();

        $import_transaction->load(['importer', 'originCountry', 'locationOfGoods', 'stages', 'assignedUser']);
        $this->transactionSyncBroadcaster->transactionChanged($import_transaction, $request->user(), 'cancelled');

        return new ImportTransactionResource($import_transaction);
    }

    public function updateStageApplicability(
        UpdateImportStageApplicabilityRequest $request,
        ImportTransaction $import_transaction,
    ): ImportTransactionResource|JsonResponse {
        $this->authorize('update', $import_transaction);

        $validated = $request->validated();
        $stage = $validated['stage'];
        $notApplicable = (bool) $validated['not_applicable'];

        if ($notApplicable && $import_transaction->documents()->where('type', $stage)->exists()) {
            return response()->json([
                'message' => 'You cannot mark this stage as not applicable after files have been uploaded to it.',
            ], 422);
        }

        $import_transaction->loadMissing('stages');

        if ($notApplicable && ! $import_transaction->isDocumentTypeReadyForUpload($stage)) {
            return response()->json([
                'message' => 'Complete the earlier required stages before marking this stage as not applicable.',
            ], 422);
        }

        $import_transaction->setStageApplicability($stage, $notApplicable, $request->user()->id);
        $import_transaction->recalculateStatus();
        $import_transaction->load(['importer', 'originCountry', 'locationOfGoods', 'stages', 'assignedUser']);

        $this->transactionSyncBroadcaster->transactionChanged(
            $import_transaction,
            $request->user(),
            'stage_applicability_updated',
        );

        return new ImportTransactionResource($import_transaction);
    }

    /**
     * DELETE /api/import-transactions/{import_transaction}
     * Delete an import transaction.
     */
    public function destroy(ImportTransaction $import_transaction)
    {
        $this->authorize('delete', $import_transaction);

        $import_transaction->delete();

        return response()->noContent();
    }
}
