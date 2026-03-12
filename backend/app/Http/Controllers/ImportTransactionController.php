<?php

namespace App\Http\Controllers;

use App\Http\Requests\CancelTransactionRequest;
use App\Http\Requests\StoreImportTransactionRequest;
use App\Http\Requests\UpdateImportTransactionRequest;
use App\Http\Resources\ImportTransactionResource;
use App\Models\ImportTransaction;
use Illuminate\Http\Request;

class ImportTransactionController extends Controller
{
    /**
     * GET /api/import-transactions
     * Paginated list with optional search and filter.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', ImportTransaction::class);

        $query = ImportTransaction::with(['importer', 'originCountry', 'stages', 'assignedUser'])
            ->withCount(['remarks as open_remarks_count' => fn($q) => $q->where('is_resolved', false)])
            ->withCount('documents');

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
            $query->where('status', $status);
        }

        // Exclude statuses (comma-separated) — used by tracking to hide completed/cancelled
        if ($exclude = $request->query('exclude_statuses')) {
            $query->whereNotIn('status', explode(',', $exclude));
        }

        // Filter by selective color
        if ($color = $request->query('selective_color')) {
            $query->where('selective_color', $color);
        }

        $perPage = $request->input('per_page', 15);
        if ($perPage > 500)
            $perPage = 500;

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
        $transaction->status = 'pending';
        $transaction->save();

        $transaction->load(['importer', 'originCountry', 'stages', 'assignedUser']);

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

        // Encoders cannot change the selectivity color — it is a BOC classification
        // that must be updated by an admin, lawyer, or paralegal.
        if ($request->user()->role === 'encoder') {
            unset($data['selective_color']);
        }

        $import_transaction->update($data);

        $import_transaction->load(['importer', 'originCountry', 'stages', 'assignedUser']);

        return new ImportTransactionResource($import_transaction);
    }

    /**
     * GET /api/import-transactions/stats
     * Returns total status counts across all records.
     */
    public function stats()
    {
        $this->authorize('viewAny', ImportTransaction::class);

        $counts = ImportTransaction::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        ")->first();

        return response()->json(['data' => $counts]);
    }

    /**
     * PATCH /api/import-transactions/{import_transaction}/cancel
     * Cancel an import transaction with a reason.
     */
    public function cancel(CancelTransactionRequest $request, ImportTransaction $import_transaction)
    {
        $this->authorize('update', $import_transaction);

        if (!in_array($import_transaction->status, ['pending', 'in_progress'])) {
            return response()->json([
                'message' => 'Only pending or in-progress transactions can be cancelled.',
            ], 422);
        }

        $import_transaction->status = 'cancelled';
        $import_transaction->notes = $request->validated()['reason'];
        $import_transaction->save();

        $import_transaction->load(['importer', 'originCountry', 'stages', 'assignedUser']);

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
