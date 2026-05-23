<?php

namespace App\Http\Controllers\Transactions;

use App\Http\Controllers\Controller;
use App\Http\Requests\Transactions\CancelTransactionRequest;
use App\Http\Requests\Transactions\StoreExportTransactionRequest;
use App\Http\Requests\Transactions\UpdateExportStageApplicabilityRequest;
use App\Http\Requests\Transactions\UpdateExportTransactionRequest;
use App\Http\Resources\Transactions\ExportTransactionResource;
use App\Models\ExportTransaction;
use App\Orchestrators\Transactions\ExportTransactionOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ExportTransactionController extends Controller
{
    public function __construct(
        private ExportTransactionOrchestrator $exports,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', ExportTransaction::class);

        return ExportTransactionResource::collection($this->exports->index($request));
    }

    public function store(StoreExportTransactionRequest $request): JsonResponse
    {
        $this->authorize('create', ExportTransaction::class);

        return (new ExportTransactionResource(
            $this->exports->store($request->validated(), $request->user())
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateExportTransactionRequest $request, ExportTransaction $export_transaction): ExportTransactionResource
    {
        $this->authorize('update', $export_transaction);

        return new ExportTransactionResource(
            $this->exports->update(
                $export_transaction,
                $request->validated(),
                $request->user(),
            )
        );
    }

    public function stats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ExportTransaction::class);

        return response()->json(['data' => $this->exports->stats($request->user())]);
    }

    public function cancel(CancelTransactionRequest $request, ExportTransaction $export_transaction): ExportTransactionResource
    {
        $this->authorize('update', $export_transaction);

        return new ExportTransactionResource(
            $this->exports->cancel(
                $export_transaction,
                $request->validated()['reason'],
                $request->user(),
            )
        );
    }

    public function updateStageApplicability(
        UpdateExportStageApplicabilityRequest $request,
        ExportTransaction $export_transaction,
    ): ExportTransactionResource|JsonResponse {
        $this->authorize('update', $export_transaction);

        $validated = $request->validated();
        $stage = $validated['stage'];
        $notApplicable = (bool) $validated['not_applicable'];

        return new ExportTransactionResource(
            $this->exports->updateStageApplicability(
                $export_transaction,
                $stage,
                $notApplicable,
                $request->user(),
            )
        );
    }

    public function destroy(ExportTransaction $export_transaction): Response
    {
        $this->authorize('delete', $export_transaction);

        $this->exports->delete($export_transaction);

        return response()->noContent();
    }
}
