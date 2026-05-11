<?php

namespace App\Orchestrators\Archives;

use App\Actions\Archives\CreateArchiveExport;
use App\Actions\Archives\CreateArchiveImport;
use App\Actions\Archives\RollbackArchiveExport;
use App\Actions\Archives\RollbackArchiveImport;
use App\Actions\Archives\UpdateArchiveExport;
use App\Actions\Archives\UpdateArchiveImport;
use App\Actions\Transactions\UpdateExportStageApplicability;
use App\Actions\Transactions\UpdateImportStageApplicability;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Queries\Archives\ArchiveIndexQuery;
use App\Queries\Archives\ArchiveOperationalQueueQuery;
use App\Support\Archives\ArchiveAuthorizer;
use App\Support\Transactions\TransactionSyncBroadcaster;

class ArchiveOrchestrator
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

    public function index(User $user, bool $mine): array
    {
        return $this->archiveIndexQuery->handle($user, $mine);
    }

    public function operationalQueue(User $user): array
    {
        return $this->archiveOperationalQueueQuery->handle($user);
    }

    public function storeImport(array $validated, User $user): ImportTransaction
    {
        $transaction = $this->createArchiveImport->handle($validated, $user);
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $user, 'archive_created');

        return $transaction;
    }

    public function storeExport(array $validated, User $user): ExportTransaction
    {
        $transaction = $this->createArchiveExport->handle($validated, $user);
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $user, 'archive_created');

        return $transaction;
    }

    public function updateImport(ImportTransaction $transaction, array $validated, User $user): ImportTransaction
    {
        return $this->updateArchiveImport->handle($transaction, $validated, $user);
    }

    public function updateExport(ExportTransaction $transaction, array $validated, User $user): ExportTransaction
    {
        return $this->updateArchiveExport->handle($transaction, $validated, $user);
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
