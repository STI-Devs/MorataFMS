<?php

namespace App\Http\Controllers;

use App\Enums\ArchiveOrigin;
use App\Queries\AdminDocumentReview\AdminDocumentReviewDetailQuery;
use App\Queries\AdminDocumentReview\AdminDocumentReviewIndexQuery;
use App\Queries\AdminDocumentReview\AdminDocumentReviewStatsQuery;
use App\Queries\AdminDocumentReview\AdminDocumentReviewTransactionQuery;
use App\Support\AdminDocumentReview\AdminDocumentReviewData;
use App\Support\Documents\DocumentObjectTagger;
use App\Support\Transactions\TransactionSyncBroadcaster;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDocumentReviewController extends Controller
{
    public function __construct(
        private TransactionSyncBroadcaster $transactionSyncBroadcaster,
        private DocumentObjectTagger $documentObjectTagger,
        private AdminDocumentReviewIndexQuery $indexQuery,
        private AdminDocumentReviewDetailQuery $detailQuery,
        private AdminDocumentReviewStatsQuery $statsQuery,
        private AdminDocumentReviewTransactionQuery $transactionQuery,
        private AdminDocumentReviewData $reviewData,
    ) {}

    /**
     * GET /api/admin/document-review
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        return response()->json($this->indexQuery->handle($request));
    }

    /**
     * GET /api/admin/document-review/{type}/{id}
     */
    public function show(Request $request, string $type, int $id): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        return response()->json($this->detailQuery->handle($type, $id));
    }

    /**
     * GET /api/admin/document-review/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        return response()->json($this->statsQuery->handle());
    }

    /**
     * POST /api/admin/document-review/{type}/{id}/archive
     */
    public function archive(Request $request, string $type, int $id): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        $transaction = $this->transactionQuery->find($type, $id);
        $requiredTypes = $this->reviewData->requiredTypeKeysFor($type, $transaction);
        $requiredCompleted = $this->reviewData->countUploadedRequiredTypes($transaction->documents, $requiredTypes);
        $hasUnresolvedRemarks = $this->reviewData->hasUnresolvedRemarks($transaction->remarks);

        if ($requiredCompleted !== count($requiredTypes) || $hasUnresolvedRemarks) {
            return response()->json([
                'message' => 'This transaction is not ready for archive.',
            ], 422);
        }

        $transaction->forceFill([
            'is_archive' => true,
            'archived_at' => now(),
            'archived_by' => $request->user()->id,
            'archive_origin' => ArchiveOrigin::ArchivedFromLive,
        ])->save();
        $transaction->load('documents');
        $this->documentObjectTagger->syncTransactionDocuments($transaction);
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $request->user(), 'archived');

        return response()->json([
            'message' => 'Transaction archived successfully.',
            'data' => [
                'id' => $transaction->id,
                'type' => $type,
                'is_archive' => true,
                'archived_at' => $this->reviewData->formatDateTime($transaction->archived_at),
                'archived_by_id' => $transaction->archived_by,
                'archive_origin' => $transaction->archive_origin?->value,
            ],
        ]);
    }
}
