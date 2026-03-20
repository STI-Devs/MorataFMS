<?php

namespace App\Http\Controllers;

use App\Enums\ExportStatus;
use App\Http\Requests\CancelTransactionRequest;
use App\Http\Requests\StoreExportTransactionRequest;
use App\Http\Requests\UpdateExportTransactionRequest;
use App\Http\Resources\ExportTransactionResource;
use App\Models\ExportTransaction;
use App\Support\Transactions\ExportStatusWorkflow;
use Illuminate\Http\Request;

class ExportTransactionController extends Controller
{
    /**
     * GET /api/export-transactions
     * Paginated list with optional search and filter.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', ExportTransaction::class);

        $query = ExportTransaction::with(['shipper', 'stages', 'assignedUser', 'destinationCountry'])
            ->withCount(['remarks as open_remarks_count' => fn ($q) => $q->where('is_resolved', false)])
            ->withCount('documents');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('bl_no', 'like', "%{$search}%")
                    ->orWhere('vessel', 'like', "%{$search}%")
                    ->orWhereHas('shipper', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });

                // Check for ID search (e.g., "EXP-0005" or just "5")
                $cleanSearch = str_replace('EXP-', '', $search);
                if (is_numeric($cleanSearch)) {
                    $q->orWhere('id', intval($cleanSearch));
                }
            });
        }

        // Filter by status
        if ($status = $request->query('status')) {
            $statuses = ExportStatusWorkflow::filterStatuses($status);
            count($statuses) === 1
                ? $query->where('status', $statuses[0])
                : $query->whereIn('status', $statuses);
        }

        // Exclude statuses (comma-separated) — used by tracking to hide completed/cancelled
        if ($exclude = $request->query('exclude_statuses')) {
            $query->whereNotIn('status', ExportStatusWorkflow::normalizeList($exclude));
        }

        $perPage = $request->input('per_page', 15);
        if ($perPage > 500) {
            $perPage = 500;
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return ExportTransactionResource::collection($transactions);
    }

    /**
     * POST /api/export-transactions
     * Create a new export transaction.
     */
    public function store(StoreExportTransactionRequest $request)
    {
        $this->authorize('create', ExportTransaction::class);

        $transaction = new ExportTransaction($request->validated());
        $transaction->assigned_user_id = $request->user()->id;
        $transaction->status = ExportStatus::Pending;
        $transaction->save();

        $transaction->load(['shipper', 'stages', 'assignedUser', 'destinationCountry']);

        return (new ExportTransactionResource($transaction))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT/PATCH /api/export-transactions/{export_transaction}
     * Update an existing export transaction.
     */
    public function update(UpdateExportTransactionRequest $request, ExportTransaction $export_transaction)
    {
        $this->authorize('update', $export_transaction);

        $export_transaction->update($request->validated());

        $export_transaction->load(['shipper', 'stages', 'assignedUser', 'destinationCountry']);

        return new ExportTransactionResource($export_transaction);
    }

    /**
     * GET /api/export-transactions/stats
     * Returns total status counts across all records.
     */
    public function stats()
    {
        $this->authorize('viewAny', ExportTransaction::class);

        $counts = ExportTransaction::selectRaw('
            COUNT(*) as total,
            SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status IN (?,?,?) THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as cancelled
        ', [
            ExportStatus::Pending->value,
            ExportStatus::InTransit->value,
            ExportStatus::Departure->value,
            ExportStatus::Processing->value,
            ExportStatus::Completed->value,
            ExportStatus::Cancelled->value,
        ])->first();

        return response()->json(['data' => $counts]);
    }

    /**
     * PATCH /api/export-transactions/{export_transaction}/cancel
     * Cancel an export transaction with a reason.
     */
    public function cancel(CancelTransactionRequest $request, ExportTransaction $export_transaction)
    {
        $this->authorize('update', $export_transaction);

        if (! ExportStatusWorkflow::isCancellable($export_transaction->status)) {
            return response()->json([
                'message' => 'Only active transactions can be cancelled.',
            ], 422);
        }

        $export_transaction->status = ExportStatus::Cancelled;
        $export_transaction->notes = $request->validated()['reason'];
        $export_transaction->save();

        $export_transaction->load(['shipper', 'stages', 'assignedUser', 'destinationCountry']);

        return new ExportTransactionResource($export_transaction);
    }

    /**
     * DELETE /api/export-transactions/{export_transaction}
     * Delete an export transaction.
     */
    public function destroy(ExportTransaction $export_transaction)
    {
        $this->authorize('delete', $export_transaction);

        $export_transaction->delete();

        return response()->noContent();
    }
}
