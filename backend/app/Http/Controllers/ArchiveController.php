<?php

namespace App\Http\Controllers;

use App\Actions\Archives\CreateArchiveExport;
use App\Actions\Archives\CreateArchiveImport;
use App\Http\Requests\StoreArchiveExportRequest;
use App\Http\Requests\StoreArchiveImportRequest;
use App\Http\Resources\ExportTransactionResource;
use App\Http\Resources\ImportTransactionResource;
use App\Queries\Archives\ArchiveIndexQuery;
use Illuminate\Http\JsonResponse;

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
        private CreateArchiveImport $createArchiveImport,
        private CreateArchiveExport $createArchiveExport,
        private ArchiveIndexQuery $archiveIndexQuery,
    ) {}

    /**
     * GET /api/archives
     * List all archived transactions grouped by year.
     *
     * An "archive" transaction is any completed import/export whose date
     * falls in a previous year (not the current year). Documents are loaded
     * via the polymorphic relationship from the DB — no S3 listing needed.
     */
    public function index(): JsonResponse
    {
        $mine = request()->boolean('mine');

        // Admin-only unless ?mine=1 (encoder can see own uploads)
        if (! $mine && ! request()->user()->isAdmin()) {
            abort(403, 'Only administrators can access the full archive.');
        }

        return response()->json([
            'data' => $this->archiveIndexQuery->handle(request()->user(), $mine),
        ]);
    }

    /**
     * POST /api/archives/import
     * Create a legacy archive import transaction.
     * The file_date must be today or in the past (before_or_equal:today).
     */
    public function storeImport(StoreArchiveImportRequest $request)
    {
        if (! in_array($request->user()->role->value, ['admin', 'encoder'])) {
            abort(403, 'Only administrators or encoders can upload archive records.');
        }

        $transaction = $this->createArchiveImport->handle(
            $request->validated(),
            $request->user(),
        );

        return (new ImportTransactionResource($transaction))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * POST /api/archives/export
     * Create a legacy archive export transaction.
     * The file_date must be today or in the past (before_or_equal:today).
     */
    public function storeExport(StoreArchiveExportRequest $request)
    {
        if (! in_array($request->user()->role->value, ['admin', 'encoder'])) {
            abort(403, 'Only administrators or encoders can upload archive records.');
        }

        $transaction = $this->createArchiveExport->handle(
            $request->validated(),
            $request->user(),
        );

        return (new ExportTransactionResource($transaction))
            ->response()
            ->setStatusCode(201);
    }
}
