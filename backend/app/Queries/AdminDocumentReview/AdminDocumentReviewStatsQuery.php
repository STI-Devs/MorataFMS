<?php

namespace App\Queries\AdminDocumentReview;

use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
use App\Models\ExportStage;
use App\Models\ExportTransaction;
use App\Models\ImportStage;
use App\Models\ImportTransaction;
use App\Support\AdminDocumentReview\AdminDocumentReviewData;

class AdminDocumentReviewStatsQuery
{
    public function __construct(
        private AdminDocumentReviewData $reviewData,
    ) {}

    public function handle(): array
    {
        $importStagesTable = (new ImportStage)->getTable();
        $exportStagesTable = (new ExportStage)->getTable();

        $importTerminalQuery = ImportTransaction::query()
            ->leftJoin($importStagesTable, "{$importStagesTable}.import_transaction_id", '=', 'import_transactions.id')
            ->where('is_archive', false)
            ->whereIn('status', $this->reviewData->importStatusValues('all'));

        $exportTerminalQuery = ExportTransaction::query()
            ->leftJoin($exportStagesTable, "{$exportStagesTable}.export_transaction_id", '=', 'export_transactions.id')
            ->where('is_archive', false)
            ->whereIn('status', $this->reviewData->exportStatusValues('all'));

        $importTerminalRow = ImportTransaction::query()
            ->toBase()
            ->where('is_archive', false)
            ->selectRaw(
                'COUNT(CASE WHEN status = ? THEN 1 END) as completed, '.
                'COUNT(CASE WHEN status = ? THEN 1 END) as cancelled',
                [ImportStatus::Completed->value, ImportStatus::Cancelled->value],
            )
            ->first();

        $exportTerminalRow = ExportTransaction::query()
            ->toBase()
            ->where('is_archive', false)
            ->selectRaw(
                'COUNT(CASE WHEN status = ? THEN 1 END) as completed, '.
                'COUNT(CASE WHEN status = ? THEN 1 END) as cancelled',
                [ExportStatus::Completed->value, ExportStatus::Cancelled->value],
            )
            ->first();

        $completedCount = (int) ($importTerminalRow->completed ?? 0)
            + (int) ($exportTerminalRow->completed ?? 0);

        $cancelledCount = (int) ($importTerminalRow->cancelled ?? 0)
            + (int) ($exportTerminalRow->cancelled ?? 0);

        $completeImportsCount = $this->reviewData->countWithAllRequiredDocuments(clone $importTerminalQuery, 'import');
        $completeExportsCount = $this->reviewData->countWithAllRequiredDocuments(clone $exportTerminalQuery, 'export');

        $missingDocsCount = (clone $importTerminalQuery)->count()
            + (clone $exportTerminalQuery)->count()
            - $completeImportsCount
            - $completeExportsCount;

        $archiveReadyCount = $this->reviewData->countArchiveReady(clone $importTerminalQuery, 'import')
            + $this->reviewData->countArchiveReady(clone $exportTerminalQuery, 'export');

        return [
            'in_review_count' => $completedCount + $cancelledCount,
            'completed_count' => $completedCount,
            'cancelled_count' => $cancelledCount,
            'missing_docs_count' => $missingDocsCount,
            'archive_ready_count' => $archiveReadyCount,
        ];
    }
}
