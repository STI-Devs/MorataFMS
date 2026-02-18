<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExportTransactionRequest;
use App\Http\Resources\ExportTransactionResource;
use App\Models\ExportTransaction;
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

        $query = ExportTransaction::with(['shipper', 'stages', 'assignedUser', 'destinationCountry']);

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
            $query->where('status', $status);
        }

        $perPage = $request->input('per_page', 15);
        if ($perPage > 100)
            $perPage = 100; // Cap at 100

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
        $transaction->status = 'pending';
        $transaction->save();

        $transaction->load(['shipper', 'stages', 'assignedUser', 'destinationCountry']);

        return (new ExportTransactionResource($transaction))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/export-transactions/stats
     * Returns total status counts across all records.
     */
    public function stats()
    {
        $this->authorize('viewAny', ExportTransaction::class);

        $counts = ExportTransaction::selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
        ")->first();

        return response()->json(['data' => $counts]);
    }

    /**
     * PATCH /api/export-transactions/{export_transaction}/cancel
     * Cancel an export transaction with a reason.
     */
    public function cancel(Request $request, ExportTransaction $export_transaction)
    {
        $this->authorize('update', $export_transaction);

        // Only pending or in_progress can be cancelled
        if (!in_array($export_transaction->status, ['pending', 'in_progress'])) {
            return response()->json([
                'message' => 'Only pending or in-progress transactions can be cancelled.',
            ], 422);
        }

        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $export_transaction->status = 'cancelled';
        $export_transaction->notes = $request->input('reason');
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
