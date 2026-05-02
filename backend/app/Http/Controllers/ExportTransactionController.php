<?php

namespace App\Http\Controllers;

use App\Actions\Transactions\CancelExportTransaction;
use App\Actions\Transactions\CreateExportTransaction;
use App\Actions\Transactions\UpdateExportStageApplicability;
use App\Actions\Transactions\UpdateExportTransaction;
use App\Enums\ExportStatus;
use App\Http\Requests\CancelTransactionRequest;
use App\Http\Requests\StoreExportTransactionRequest;
use App\Http\Requests\UpdateExportStageApplicabilityRequest;
use App\Http\Requests\UpdateExportTransactionRequest;
use App\Http\Resources\ExportTransactionResource;
use App\Models\ExportTransaction;
use App\Queries\Transactions\ExportTransactionIndexQuery;
use App\Queries\Transactions\ExportTransactionStatsQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ExportTransactionController extends Controller
{
    public function __construct(
        private ExportTransactionIndexQuery $indexQuery,
        private ExportTransactionStatsQuery $statsQuery,
        private CreateExportTransaction $createExportTransaction,
        private UpdateExportTransaction $updateExportTransaction,
        private CancelExportTransaction $cancelExportTransaction,
        private UpdateExportStageApplicability $updateExportStageApplicability,
    ) {}

    /**
     * GET /api/export-transactions
     * Paginated list with optional search and filter.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', ExportTransaction::class);

        return ExportTransactionResource::collection($this->indexQuery->handle($request));
    }

    /**
     * POST /api/export-transactions
     * Create a new export transaction.
     */
    public function store(StoreExportTransactionRequest $request): JsonResponse
    {
        $this->authorize('create', ExportTransaction::class);

        $transaction = $this->createExportTransaction->handle($request->validated(), $request->user());

        return (new ExportTransactionResource($transaction))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT/PATCH /api/export-transactions/{export_transaction}
     * Update an existing export transaction.
     */
    public function update(UpdateExportTransactionRequest $request, ExportTransaction $export_transaction): ExportTransactionResource
    {
        $this->authorize('update', $export_transaction);

        $export_transaction = $this->updateExportTransaction->handle(
            $export_transaction,
            $request->validated(),
            $request->user(),
        );

        return new ExportTransactionResource($export_transaction);
    }

    /**
     * GET /api/export-transactions/stats
     * Returns total status counts across all records.
     */
    public function stats(): JsonResponse
    {
        $this->authorize('viewAny', ExportTransaction::class);

        return response()->json(['data' => $this->statsQuery->handle(request()->user())]);
    }

    /**
     * PATCH /api/export-transactions/{export_transaction}/cancel
     * Cancel an export transaction with a reason.
     */
    public function cancel(CancelTransactionRequest $request, ExportTransaction $export_transaction): ExportTransactionResource
    {
        $this->authorize('update', $export_transaction);

        $export_transaction = $this->cancelExportTransaction->handle(
            $export_transaction,
            $request->validated()['reason'],
            $request->user(),
        );

        return new ExportTransactionResource($export_transaction);
    }

    public function updateStageApplicability(
        UpdateExportStageApplicabilityRequest $request,
        ExportTransaction $export_transaction,
    ): ExportTransactionResource|JsonResponse {
        $this->authorize('update', $export_transaction);

        $validated = $request->validated();
        $stage = $validated['stage'];
        $notApplicable = (bool) $validated['not_applicable'];

        $export_transaction = $this->updateExportStageApplicability->handle(
            $export_transaction,
            $stage,
            $notApplicable,
            $request->user(),
        );

        return new ExportTransactionResource($export_transaction);
    }

    /**
     * DELETE /api/export-transactions/{export_transaction}
     * Delete an export transaction.
     */
    public function destroy(ExportTransaction $export_transaction): Response
    {
        $this->authorize('delete', $export_transaction);

        if ($export_transaction->status !== ExportStatus::Cancelled) {
            return response()->json([
                'message' => 'Only cancelled transactions can be deleted.',
            ], 422);
        }

        $export_transaction->delete();

        return response()->noContent();
    }
}
