<?php

namespace App\Http\Controllers\AdminDocumentReview;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminDocumentReview\ArchiveReviewedTransactionsRequest;
use App\Orchestrators\AdminDocumentReview\AdminDocumentReviewOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDocumentReviewController extends Controller
{
    public function __construct(
        private AdminDocumentReviewOrchestrator $adminDocumentReview,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        return response()->json($this->adminDocumentReview->index($request));
    }

    public function show(Request $request, string $type, int $id): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        return response()->json($this->adminDocumentReview->show($type, $id));
    }

    public function stats(Request $request): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        return response()->json($this->adminDocumentReview->stats());
    }

    public function archive(Request $request, string $type, int $id): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        return response()->json([
            'message' => 'Transaction archived successfully.',
            'data' => $this->adminDocumentReview->archive($type, $id, $request->user()),
        ]);
    }

    public function bulkArchive(ArchiveReviewedTransactionsRequest $request): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        $archivedTransactions = $this->adminDocumentReview->bulkArchive(
            $request->validated()['transactions'],
            $request->user(),
        );

        return response()->json([
            'message' => count($archivedTransactions).' transactions archived successfully.',
            'data' => $archivedTransactions,
            'meta' => [
                'archived_count' => count($archivedTransactions),
            ],
        ]);
    }
}
