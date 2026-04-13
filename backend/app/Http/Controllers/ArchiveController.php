<?php

namespace App\Http\Controllers;

use App\Actions\Archives\CreateArchiveExport;
use App\Actions\Archives\CreateArchiveImport;
use App\Enums\ArchiveOrigin;
use App\Http\Requests\StoreArchiveExportRequest;
use App\Http\Requests\StoreArchiveImportRequest;
use App\Http\Resources\ExportTransactionResource;
use App\Http\Resources\ImportTransactionResource;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Queries\Archives\ArchiveIndexQuery;
use App\Support\Operations\Deletion\Transactions\TransactionDeletionExecutor;
use App\Support\Operations\Deletion\Transactions\TransactionDeletionPlanner;
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
        private CreateArchiveImport $createArchiveImport,
        private CreateArchiveExport $createArchiveExport,
        private ArchiveIndexQuery $archiveIndexQuery,
        private TransactionSyncBroadcaster $transactionSyncBroadcaster,
        private TransactionDeletionPlanner $transactionDeletionPlanner,
        private TransactionDeletionExecutor $transactionDeletionExecutor,
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
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $request->user(), 'archive_created');

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
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $request->user(), 'archive_created');

        return (new ExportTransactionResource($transaction))
            ->response()
            ->setStatusCode(201);
    }

    public function rollbackImport(Request $request, ImportTransaction $importTransaction): Response
    {
        $this->authorizeArchiveRollback($request->user(), $importTransaction);

        $plan = $this->transactionDeletionPlanner->build([$importTransaction->id], [], config('database.default'));

        $this->transactionSyncBroadcaster->transactionChanged($importTransaction, $request->user(), 'archive_rolled_back');
        $this->transactionDeletionExecutor->delete($plan, true);

        return response()->noContent();
    }

    public function rollbackExport(Request $request, ExportTransaction $exportTransaction): Response
    {
        $this->authorizeArchiveRollback($request->user(), $exportTransaction);

        $plan = $this->transactionDeletionPlanner->build([], [$exportTransaction->id], config('database.default'));

        $this->transactionSyncBroadcaster->transactionChanged($exportTransaction, $request->user(), 'archive_rolled_back');
        $this->transactionDeletionExecutor->delete($plan, true);

        return response()->noContent();
    }

    private function authorizeArchiveRollback(
        User $user,
        ImportTransaction|ExportTransaction $transaction,
    ): void {
        if (! $transaction->is_archive || $transaction->archive_origin !== ArchiveOrigin::DirectArchiveUpload) {
            abort(404, 'Archive transaction not found.');
        }

        if ($user->isAdmin()) {
            return;
        }

        if (! $user->hasBrokerageAccess() || $transaction->assigned_user_id !== $user->id) {
            abort(403, 'You are not allowed to roll back this archive upload.');
        }
    }
}
