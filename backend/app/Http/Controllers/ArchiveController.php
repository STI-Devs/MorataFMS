<?php

namespace App\Http\Controllers;

use App\Actions\Archives\CreateArchiveExport;
use App\Actions\Archives\CreateArchiveImport;
use App\Actions\Archives\RollbackArchiveExport;
use App\Actions\Archives\RollbackArchiveImport;
use App\Actions\Archives\UpdateArchiveExport;
use App\Actions\Archives\UpdateArchiveImport;
use App\Actions\Transactions\UpdateExportStageApplicability;
use App\Actions\Transactions\UpdateImportStageApplicability;
use App\Http\Requests\StoreArchiveExportRequest;
use App\Http\Requests\StoreArchiveImportRequest;
use App\Http\Requests\UpdateArchiveExportRequest;
use App\Http\Requests\UpdateArchiveImportRequest;
use App\Http\Requests\UpdateExportStageApplicabilityRequest;
use App\Http\Requests\UpdateImportStageApplicabilityRequest;
use App\Http\Resources\ExportTransactionResource;
use App\Http\Resources\ImportTransactionResource;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Queries\Archives\ArchiveIndexQuery;
use App\Queries\Archives\ArchiveOperationalQueueQuery;
use App\Support\Archives\ArchiveAuthorizer;
use App\Support\Transactions\TransactionSyncBroadcaster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Handles legacy archive uploads and listing.
 *
 * This controller is intentionally separate from ImportTransactionController
 * and ExportTransactionController so archive-specific validation (e.g. past-only
 * file_date) is enforced at the API level, not just the frontend.
 *
 * Routes:
 *   GET  /api/archives         → list archive years + documents
 *   POST /api/archives/import  → create archive import
 *   POST /api/archives/export  → create archive export
 */
class ArchiveController extends Controller
{
    public function __construct(
        private ArchiveAuthorizer $archiveAuthorizer,
        private ArchiveIndexQuery $archiveIndexQuery,
        private ArchiveOperationalQueueQuery $archiveOperationalQueueQuery,
        private CreateArchiveImport $createArchiveImport,
        private CreateArchiveExport $createArchiveExport,
        private UpdateArchiveImport $updateArchiveImport,
        private UpdateArchiveExport $updateArchiveExport,
        private UpdateImportStageApplicability $updateImportStageApplicability,
        private UpdateExportStageApplicability $updateExportStageApplicability,
        private RollbackArchiveImport $rollbackArchiveImport,
        private RollbackArchiveExport $rollbackArchiveExport,
        private TransactionSyncBroadcaster $transactionSyncBroadcaster,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $mine = $request->boolean('mine');
        $this->archiveAuthorizer->assertCanIndex($request->user(), $mine);

        return response()->json([
            'data' => $this->archiveIndexQuery->handle($request->user(), $mine),
        ]);
    }

    public function operationalQueue(Request $request): JsonResponse
    {
        $this->archiveAuthorizer->assertCanAccessOperationalQueue($request->user());

        return response()->json(
            $this->archiveOperationalQueueQuery->handle($request->user()),
        );
    }

    public function storeImport(StoreArchiveImportRequest $request): JsonResponse
    {
        $this->archiveAuthorizer->assertCanCreate($request->user());

        $transaction = $this->createArchiveImport->handle(
            $request->validated(),
            $request->user(),
        );
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $request->user(), 'archive_created');

        return (new ImportTransactionResource($transaction))
            ->response()
            ->setStatusCode(201);
    }

    public function storeExport(StoreArchiveExportRequest $request): JsonResponse
    {
        $this->archiveAuthorizer->assertCanCreate($request->user());

        $transaction = $this->createArchiveExport->handle(
            $request->validated(),
            $request->user(),
        );
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $request->user(), 'archive_created');

        return (new ExportTransactionResource($transaction))
            ->response()
            ->setStatusCode(201);
    }

    public function updateImport(
        UpdateArchiveImportRequest $request,
        ImportTransaction $importTransaction,
    ): ImportTransactionResource {
        $this->archiveAuthorizer->assertCanUpdate($request->user(), $importTransaction);

        $importTransaction = $this->updateArchiveImport->handle(
            $importTransaction,
            $request->validated(),
            $request->user(),
        );

        return new ImportTransactionResource($importTransaction);
    }

    public function updateExport(
        UpdateArchiveExportRequest $request,
        ExportTransaction $exportTransaction,
    ): ExportTransactionResource {
        $this->archiveAuthorizer->assertCanUpdate($request->user(), $exportTransaction);

        $exportTransaction = $this->updateArchiveExport->handle(
            $exportTransaction,
            $request->validated(),
            $request->user(),
        );

        return new ExportTransactionResource($exportTransaction);
    }

    public function updateImportStageApplicability(
        UpdateImportStageApplicabilityRequest $request,
        ImportTransaction $importTransaction,
    ): ImportTransactionResource {
        $validated = $request->validated();
        $stage = $validated['stage'];
        $notApplicable = (bool) $validated['not_applicable'];

        $this->archiveAuthorizer->assertCanUpdateStageApplicability(
            $request->user(),
            $importTransaction,
            $stage,
        );

        $importTransaction = $this->updateImportStageApplicability->handle(
            $importTransaction,
            $stage,
            $notApplicable,
            $request->user(),
            'archive_stage_applicability_updated',
        );

        return new ImportTransactionResource($importTransaction);
    }

    public function updateExportStageApplicability(
        UpdateExportStageApplicabilityRequest $request,
        ExportTransaction $exportTransaction,
    ): ExportTransactionResource {
        $validated = $request->validated();
        $stage = $validated['stage'];
        $notApplicable = (bool) $validated['not_applicable'];

        $this->archiveAuthorizer->assertCanUpdateStageApplicability(
            $request->user(),
            $exportTransaction,
            $stage,
        );

        $exportTransaction = $this->updateExportStageApplicability->handle(
            $exportTransaction,
            $stage,
            $notApplicable,
            $request->user(),
            'archive_stage_applicability_updated',
        );

        return new ExportTransactionResource($exportTransaction);
    }

    public function rollbackImport(Request $request, ImportTransaction $importTransaction): Response
    {
        $this->archiveAuthorizer->assertCanRollback($request->user(), $importTransaction);
        $this->rollbackArchiveImport->handle($importTransaction, $request->user());

        return response()->noContent();
    }

    public function rollbackExport(Request $request, ExportTransaction $exportTransaction): Response
    {
        $this->archiveAuthorizer->assertCanRollback($request->user(), $exportTransaction);
        $this->rollbackArchiveExport->handle($exportTransaction, $request->user());

        return response()->noContent();
    }
}
