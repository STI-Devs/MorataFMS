<?php

namespace App\Http\Controllers\Transactions;

use App\Http\Controllers\Controller;
use App\Http\Requests\Transactions\CancelTransactionRequest;
use App\Http\Requests\Transactions\StoreImportTransactionRequest;
use App\Http\Requests\Transactions\UpdateImportStageApplicabilityRequest;
use App\Http\Requests\Transactions\UpdateImportTransactionRequest;
use App\Http\Resources\Transactions\ImportTransactionResource;
use App\Models\ImportTransaction;
use App\Orchestrators\Transactions\ImportTransactionOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

class ImportTransactionController extends Controller
{
    public function __construct(
        private ImportTransactionOrchestrator $imports,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', ImportTransaction::class);

        return ImportTransactionResource::collection($this->imports->index($request));
    }

    public function store(StoreImportTransactionRequest $request): JsonResponse
    {
        $this->authorize('create', ImportTransaction::class);

        return (new ImportTransactionResource(
            $this->imports->store($request->validated(), $request->user())
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateImportTransactionRequest $request, ImportTransaction $import_transaction): ImportTransactionResource
    {
        $this->authorize('update', $import_transaction);

        return new ImportTransactionResource(
            $this->imports->update(
                $import_transaction,
                $request->validated(),
                $request->user(),
            )
        );
    }

    public function stats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ImportTransaction::class);

        return response()->json(['data' => $this->imports->stats($request->user())]);
    }

    public function cancel(CancelTransactionRequest $request, ImportTransaction $import_transaction): ImportTransactionResource
    {
        $this->authorize('update', $import_transaction);

        return new ImportTransactionResource(
            $this->imports->cancel(
                $import_transaction,
                $request->validated()['reason'],
                $request->user(),
            )
        );
    }

    public function updateStageApplicability(
        UpdateImportStageApplicabilityRequest $request,
        ImportTransaction $import_transaction,
    ): ImportTransactionResource|JsonResponse {
        $this->authorize('update', $import_transaction);

        $validated = $request->validated();
        $stage = $validated['stage'];
        $notApplicable = (bool) $validated['not_applicable'];

        return new ImportTransactionResource(
            $this->imports->updateStageApplicability(
                $import_transaction,
                $stage,
                $notApplicable,
                $request->user(),
            )
        );
    }

    public function destroy(ImportTransaction $import_transaction): Response
    {
        $this->authorize('delete', $import_transaction);

        $this->imports->delete($import_transaction);

        return response()->noContent();
    }
}
