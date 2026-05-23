<?php

namespace App\Orchestrators\Archives;

use App\Actions\Archives\CreateArchiveExport;
use App\Actions\Archives\CreateArchiveImport;
use App\Actions\Archives\CreateArchiveZipExport;
use App\Actions\Archives\DeleteArchiveZipExport;
use App\Actions\Archives\RetryArchiveZipExport;
use App\Actions\Archives\RollbackArchiveExport;
use App\Actions\Archives\RollbackArchiveImport;
use App\Actions\Archives\UpdateArchiveExport;
use App\Actions\Archives\UpdateArchiveImport;
use App\Actions\Transactions\UpdateExportStageApplicability;
use App\Actions\Transactions\UpdateImportStageApplicability;
use App\Data\Archives\ArchiveDocumentIndexFilters;
use App\Data\Archives\ArchiveExportData;
use App\Data\Archives\ArchiveFolderHistoryFilters;
use App\Data\Archives\ArchiveImportData;
use App\Data\Archives\ArchiveZipExportData;
use App\Data\Archives\ArchiveZipExportIndexFilters;
use App\Models\ArchiveZipExport;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Queries\Archives\ArchiveDocumentIndexQuery;
use App\Queries\Archives\ArchiveFolderHistoryQuery;
use App\Queries\Archives\ArchiveIndexQuery;
use App\Queries\Archives\ArchiveOperationalQueueQuery;
use App\Queries\Archives\ArchiveZipExportIndexQuery;
use App\Support\Archives\ArchiveAuthorizer;
use App\Support\Archives\ArchiveZipExportDownloader;
use App\Support\Transactions\TransactionSyncBroadcaster;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ArchiveOrchestrator
{
    public function __construct(
        private ArchiveAuthorizer $archiveAuthorizer,
        private ArchiveIndexQuery $archiveIndexQuery,
        private ArchiveDocumentIndexQuery $archiveDocumentIndexQuery,
        private ArchiveFolderHistoryQuery $archiveFolderHistoryQuery,
        private ArchiveOperationalQueueQuery $archiveOperationalQueueQuery,
        private ArchiveZipExportIndexQuery $archiveZipExportIndexQuery,
        private CreateArchiveImport $createArchiveImport,
        private CreateArchiveExport $createArchiveExport,
        private CreateArchiveZipExport $createArchiveZipExport,
        private RetryArchiveZipExport $retryArchiveZipExport,
        private DeleteArchiveZipExport $deleteArchiveZipExport,
        private UpdateArchiveImport $updateArchiveImport,
        private UpdateArchiveExport $updateArchiveExport,
        private UpdateImportStageApplicability $updateImportStageApplicability,
        private UpdateExportStageApplicability $updateExportStageApplicability,
        private RollbackArchiveImport $rollbackArchiveImport,
        private RollbackArchiveExport $rollbackArchiveExport,
        private ArchiveZipExportDownloader $archiveZipExportDownloader,
        private TransactionSyncBroadcaster $transactionSyncBroadcaster,
    ) {}

    public function assertCanIndex(User $user, bool $mine): void
    {
        $this->archiveAuthorizer->assertCanIndex($user, $mine);
    }

    public function assertCanAccessOperationalQueue(User $user): void
    {
        $this->archiveAuthorizer->assertCanAccessOperationalQueue($user);
    }

    public function assertCanCreate(User $user): void
    {
        $this->archiveAuthorizer->assertCanCreate($user);
    }

    public function assertCanUpdate(User $user, ImportTransaction|ExportTransaction $transaction): void
    {
        $this->archiveAuthorizer->assertCanUpdate($user, $transaction);
    }

    public function assertCanUpdateStageApplicability(
        User $user,
        ImportTransaction|ExportTransaction $transaction,
        string $stage,
    ): void {
        $this->archiveAuthorizer->assertCanUpdateStageApplicability($user, $transaction, $stage);
    }

    public function assertCanRollback(User $user, ImportTransaction|ExportTransaction $transaction): void
    {
        $this->archiveAuthorizer->assertCanRollback($user, $transaction);
    }

    public function assertCanAccessZipExport(User $user, ArchiveZipExport $archiveZipExport): void
    {
        $this->archiveAuthorizer->assertCanAccessZipExport($user, $archiveZipExport);
    }

    public function index(User $user, bool $mine): array
    {
        return $this->archiveIndexQuery->handle($user, $mine);
    }

    public function documents(User $user, ArchiveDocumentIndexFilters $filters): array
    {
        return $this->archiveDocumentIndexQuery->handle($user, $filters);
    }

    public function folderHistory(User $user, ArchiveFolderHistoryFilters $filters): array
    {
        return $this->archiveFolderHistoryQuery->handle($user, $filters);
    }

    public function operationalQueue(User $user): array
    {
        return $this->archiveOperationalQueueQuery->handle($user);
    }

    /**
     * @return LengthAwarePaginator<int, ArchiveZipExport>
     */
    public function zipExports(ArchiveZipExportIndexFilters $filters, User $user): LengthAwarePaginator
    {
        return $this->archiveZipExportIndexQuery->handle($filters, $user);
    }

    public function storeZipExport(User $user, ArchiveZipExportData $data): ArchiveZipExport
    {
        return $this->createArchiveZipExport->handle($user, $data);
    }

    public function retryZipExport(ArchiveZipExport $archiveZipExport): ArchiveZipExport
    {
        return $this->retryArchiveZipExport->handle($archiveZipExport);
    }

    public function downloadZipExport(ArchiveZipExport $archiveZipExport): StreamedResponse
    {
        return $this->archiveZipExportDownloader->download($archiveZipExport);
    }

    public function deleteZipExport(ArchiveZipExport $archiveZipExport): void
    {
        $this->deleteArchiveZipExport->handle($archiveZipExport);
    }

    public function storeImport(ArchiveImportData $data, User $user): ImportTransaction
    {
        $transaction = $this->createArchiveImport->handle($data, $user);
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $user, 'archive_created');

        return $transaction;
    }

    public function storeExport(ArchiveExportData $data, User $user): ExportTransaction
    {
        $transaction = $this->createArchiveExport->handle($data, $user);
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $user, 'archive_created');

        return $transaction;
    }

    public function updateImport(ImportTransaction $transaction, ArchiveImportData $data, User $user): ImportTransaction
    {
        return $this->updateArchiveImport->handle($transaction, $data, $user);
    }

    public function updateExport(ExportTransaction $transaction, ArchiveExportData $data, User $user): ExportTransaction
    {
        return $this->updateArchiveExport->handle($transaction, $data, $user);
    }

    public function updateImportStageApplicability(
        ImportTransaction $transaction,
        string $stage,
        bool $notApplicable,
        User $user,
    ): ImportTransaction {
        return $this->updateImportStageApplicability->handle(
            $transaction,
            $stage,
            $notApplicable,
            $user,
            'archive_stage_applicability_updated',
        );
    }

    public function updateExportStageApplicability(
        ExportTransaction $transaction,
        string $stage,
        bool $notApplicable,
        User $user,
    ): ExportTransaction {
        return $this->updateExportStageApplicability->handle(
            $transaction,
            $stage,
            $notApplicable,
            $user,
            'archive_stage_applicability_updated',
        );
    }

    public function rollbackImport(ImportTransaction $transaction, User $user): void
    {
        $this->rollbackArchiveImport->handle($transaction, $user);
    }

    public function rollbackExport(ExportTransaction $transaction, User $user): void
    {
        $this->rollbackArchiveExport->handle($transaction, $user);
    }
}
