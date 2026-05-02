<?php

namespace App\Http\Controllers;

use App\Actions\AdminDocumentReview\ArchiveReviewedTransaction;
use App\Queries\AdminDocumentReview\AdminDocumentReviewDetailQuery;
use App\Queries\AdminDocumentReview\AdminDocumentReviewIndexQuery;
use App\Queries\AdminDocumentReview\AdminDocumentReviewStatsQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDocumentReviewController extends Controller
{
    public function __construct(
        private AdminDocumentReviewIndexQuery $indexQuery,
        private AdminDocumentReviewDetailQuery $detailQuery,
        private AdminDocumentReviewStatsQuery $statsQuery,
        private ArchiveReviewedTransaction $archiveReviewedTransaction,
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

        return response()->json([
            'message' => 'Transaction archived successfully.',
            'data' => $this->archiveReviewedTransaction->handle($type, $id, $request->user()),
        ]);
    }
}
