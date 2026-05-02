<?php

namespace App\Http\Controllers;

use App\Actions\Transactions\CancelImportTransaction;
use App\Actions\Transactions\CreateImportTransaction;
use App\Actions\Transactions\UpdateImportStageApplicability;
use App\Actions\Transactions\UpdateImportTransaction;
use App\Enums\ImportStatus;
use App\Http\Requests\CancelTransactionRequest;
use App\Http\Requests\StoreImportTransactionRequest;
use App\Http\Requests\UpdateImportStageApplicabilityRequest;
use App\Http\Requests\UpdateImportTransactionRequest;
use App\Http\Resources\ImportTransactionResource;
use App\Models\ImportTransaction;
use App\Queries\Transactions\ImportTransactionIndexQuery;
use App\Queries\Transactions\ImportTransactionStatsQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ImportTransactionController extends Controller
{
    public function __construct(
        private ImportTransactionIndexQuery $indexQuery,
        private ImportTransactionStatsQuery $statsQuery,
        private CreateImportTransaction $createImportTransaction,
        private UpdateImportTransaction $updateImportTransaction,
        private CancelImportTransaction $cancelImportTransaction,
        private UpdateImportStageApplicability $updateImportStageApplicability,
    ) {}

    /**
     * GET /api/import-transactions
     * Paginated list with optional search and filter.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', ImportTransaction::class);

        return ImportTransactionResource::collection($this->indexQuery->handle($request));
    }

    /**
     * POST /api/import-transactions
     * Create a new import transaction.
     */
    public function store(StoreImportTransactionRequest $request): JsonResponse
    {
        $this->authorize('create', ImportTransaction::class);

        $transaction = $this->createImportTransaction->handle($request->validated(), $request->user());

        return (new ImportTransactionResource($transaction))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * PUT/PATCH /api/import-transactions/{import_transaction}
     * Update an existing import transaction.
     */
    public function update(UpdateImportTransactionRequest $request, ImportTransaction $import_transaction): ImportTransactionResource
    {
        $this->authorize('update', $import_transaction);

        $import_transaction = $this->updateImportTransaction->handle(
            $import_transaction,
            $request->validated(),
            $request->user(),
        );

        return new ImportTransactionResource($import_transaction);
    }

    /**
     * GET /api/import-transactions/stats
     * Returns total status counts across all records.
     */
    public function stats(): JsonResponse
    {
        $this->authorize('viewAny', ImportTransaction::class);

        return response()->json(['data' => $this->statsQuery->handle(request()->user())]);
    }

    /**
     * PATCH /api/import-transactions/{import_transaction}/cancel
     * Cancel an import transaction with a reason.
     */
    public function cancel(CancelTransactionRequest $request, ImportTransaction $import_transaction): ImportTransactionResource
    {
        $this->authorize('update', $import_transaction);

        $import_transaction = $this->cancelImportTransaction->handle(
            $import_transaction,
            $request->validated()['reason'],
            $request->user(),
        );

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

        $import_transaction = $this->updateImportStageApplicability->handle(
            $import_transaction,
            $stage,
            $notApplicable,
            $request->user(),
        );

        return new ImportTransactionResource($import_transaction);
    }

    /**
     * DELETE /api/import-transactions/{import_transaction}
     * Delete an import transaction.
     */
    public function destroy(ImportTransaction $import_transaction): Response
    {
        $this->authorize('delete', $import_transaction);

        if ($import_transaction->status !== ImportStatus::Cancelled) {
            return response()->json([
                'message' => 'Only cancelled transactions can be deleted.',
            ], 422);
        }

        $import_transaction->delete();

        return response()->noContent();
    }
}
