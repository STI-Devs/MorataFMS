<?php

namespace App\Queries\AdminDocumentReview;

use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Support\AdminDocumentReview\AdminDocumentReviewData;

class AdminDocumentReviewStatsQuery
{
    public function __construct(
        private AdminDocumentReviewData $reviewData,
    ) {}

    public function handle(): array
    {
        $importTerminalQuery = ImportTransaction::query()
            ->leftJoin('import_stages', 'import_stages.import_transaction_id', '=', 'import_transactions.id')
            ->where('is_archive', false)
            ->whereIn('status', $this->reviewData->importStatusValues('all'));

        $exportTerminalQuery = ExportTransaction::query()
            ->leftJoin('export_stages', 'export_stages.export_transaction_id', '=', 'export_transactions.id')
            ->where('is_archive', false)
            ->whereIn('status', $this->reviewData->exportStatusValues('all'));

        $completedCount = ImportTransaction::query()
            ->where('is_archive', false)
            ->where('status', ImportStatus::Completed->value)
            ->count()
            + ExportTransaction::query()
                ->where('is_archive', false)
                ->where('status', ExportStatus::Completed->value)
                ->count();

        $cancelledCount = ImportTransaction::query()
            ->where('is_archive', false)
            ->where('status', ImportStatus::Cancelled->value)
            ->count()
            + ExportTransaction::query()
                ->where('is_archive', false)
                ->where('status', ExportStatus::Cancelled->value)
                ->count();

        $completeImportsCount = $this->reviewData->countWithAllRequiredDocuments(clone $importTerminalQuery, 'import');
        $completeExportsCount = $this->reviewData->countWithAllRequiredDocuments(clone $exportTerminalQuery, 'export');

        $missingDocsCount = (clone $importTerminalQuery)->count()
            + (clone $exportTerminalQuery)->count()
            - $completeImportsCount
            - $completeExportsCount;

        $archiveReadyCount = $this->reviewData->countArchiveReady(clone $importTerminalQuery, 'import')
            + $this->reviewData->countArchiveReady(clone $exportTerminalQuery, 'export');

        return [
            'completed_count' => $completedCount,
            'cancelled_count' => $cancelledCount,
            'missing_docs_count' => $missingDocsCount,
            'archive_ready_count' => $archiveReadyCount,
        ];
    }
}
