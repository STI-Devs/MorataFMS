<?php

namespace App\Http\Controllers\Archives;

use App\Http\Controllers\Controller;
use App\Http\Requests\Archives\ArchiveDocumentIndexRequest;
use App\Http\Requests\Archives\ArchiveFolderHistoryRequest;
use App\Http\Requests\Archives\StoreArchiveExportRequest;
use App\Http\Requests\Archives\StoreArchiveImportRequest;
use App\Http\Requests\Archives\UpdateArchiveExportRequest;
use App\Http\Requests\Archives\UpdateArchiveImportRequest;
use App\Http\Requests\Transactions\UpdateExportStageApplicabilityRequest;
use App\Http\Requests\Transactions\UpdateImportStageApplicabilityRequest;
use App\Http\Resources\Transactions\ExportTransactionResource;
use App\Http\Resources\Transactions\ImportTransactionResource;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Orchestrators\Archives\ArchiveOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ArchiveController extends Controller
{
    public function __construct(
        private ArchiveOrchestrator $archives,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $mine = $request->boolean('mine');
        $this->archives->assertCanIndex($request->user(), $mine);

        return response()->json([
            'data' => $this->archives->index($request->user(), $mine),
        ]);
    }

    public function folderHistory(ArchiveFolderHistoryRequest $request): JsonResponse
    {
        $filters = $request->filters();
        $this->archives->assertCanIndex($request->user(), $filters->mine);

        return response()->json(
            $this->archives->folderHistory($request->user(), $filters),
        );
    }

    public function documents(ArchiveDocumentIndexRequest $request): JsonResponse
    {
        $filters = $request->filters();
        $this->archives->assertCanIndex($request->user(), $filters->mine);

        return response()->json(
            $this->archives->documents($request->user(), $filters),
        );
    }

    public function operationalQueue(Request $request): JsonResponse
    {
        $this->archives->assertCanAccessOperationalQueue($request->user());

        return response()->json(
            $this->archives->operationalQueue($request->user()),
        );
    }

    public function storeImport(StoreArchiveImportRequest $request): JsonResponse
    {
        $this->archives->assertCanCreate($request->user());

        return (new ImportTransactionResource(
            $this->archives->storeImport(
                $request->archiveData(),
                $request->user(),
            )
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function storeExport(StoreArchiveExportRequest $request): JsonResponse
    {
        $this->archives->assertCanCreate($request->user());

        return (new ExportTransactionResource(
            $this->archives->storeExport(
                $request->archiveData(),
                $request->user(),
            )
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function updateImport(
        UpdateArchiveImportRequest $request,
        ImportTransaction $importTransaction,
    ): ImportTransactionResource {
        $this->archives->assertCanUpdate($request->user(), $importTransaction);

        return new ImportTransactionResource(
            $this->archives->updateImport(
                $importTransaction,
                $request->archiveData(),
                $request->user(),
            )
        );
    }

    public function updateExport(
        UpdateArchiveExportRequest $request,
        ExportTransaction $exportTransaction,
    ): ExportTransactionResource {
        $this->archives->assertCanUpdate($request->user(), $exportTransaction);

        return new ExportTransactionResource(
            $this->archives->updateExport(
                $exportTransaction,
                $request->archiveData(),
                $request->user(),
            )
        );
    }

    public function updateImportStageApplicability(
        UpdateImportStageApplicabilityRequest $request,
        ImportTransaction $importTransaction,
    ): ImportTransactionResource {
        $validated = $request->validated();
        $stage = $validated['stage'];
        $notApplicable = (bool) $validated['not_applicable'];

        $this->archives->assertCanUpdateStageApplicability(
            $request->user(),
            $importTransaction,
            $stage,
        );

        return new ImportTransactionResource(
            $this->archives->updateImportStageApplicability(
                $importTransaction,
                $stage,
                $notApplicable,
                $request->user(),
            )
        );
    }

    public function updateExportStageApplicability(
        UpdateExportStageApplicabilityRequest $request,
        ExportTransaction $exportTransaction,
    ): ExportTransactionResource {
        $validated = $request->validated();
        $stage = $validated['stage'];
        $notApplicable = (bool) $validated['not_applicable'];

        $this->archives->assertCanUpdateStageApplicability(
            $request->user(),
            $exportTransaction,
            $stage,
        );

        return new ExportTransactionResource(
            $this->archives->updateExportStageApplicability(
                $exportTransaction,
                $stage,
                $notApplicable,
                $request->user(),
            )
        );
    }

    public function rollbackImport(Request $request, ImportTransaction $importTransaction): Response
    {
        $this->archives->assertCanRollback($request->user(), $importTransaction);
        $this->archives->rollbackImport($importTransaction, $request->user());

        return response()->noContent();
    }

    public function rollbackExport(Request $request, ExportTransaction $exportTransaction): Response
    {
        $this->archives->assertCanRollback($request->user(), $exportTransaction);
        $this->archives->rollbackExport($exportTransaction, $request->user());

        return response()->noContent();
    }
}
