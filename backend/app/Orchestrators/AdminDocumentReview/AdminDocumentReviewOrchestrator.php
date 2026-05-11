<?php

namespace App\Orchestrators\AdminDocumentReview;

use App\Actions\AdminDocumentReview\ArchiveReviewedTransaction;
use App\Models\User;
use App\Queries\AdminDocumentReview\AdminDocumentReviewDetailQuery;
use App\Queries\AdminDocumentReview\AdminDocumentReviewIndexQuery;
use App\Queries\AdminDocumentReview\AdminDocumentReviewStatsQuery;
use Illuminate\Http\Request;

class AdminDocumentReviewOrchestrator
{
    public function __construct(
        private AdminDocumentReviewIndexQuery $indexQuery,
        private AdminDocumentReviewDetailQuery $detailQuery,
        private AdminDocumentReviewStatsQuery $statsQuery,
        private ArchiveReviewedTransaction $archiveReviewedTransaction,
    ) {}

    public function index(Request $request): array
    {
        return $this->indexQuery->handle($request);
    }

    public function show(string $type, int $id): array
    {
        return $this->detailQuery->handle($type, $id);
    }

    public function stats(): array
    {
        return $this->statsQuery->handle();
    }

    public function archive(string $type, int $id, User $user): array
    {
        return $this->archiveReviewedTransaction->handle($type, $id, $user);
    }

    public function bulkArchive(array $transactions, User $user): array
    {
        return $this->archiveReviewedTransaction->handleMany($transactions, $user);
    }
}
