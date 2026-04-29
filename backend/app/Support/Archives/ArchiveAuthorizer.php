<?php

namespace App\Support\Archives;

use App\Enums\ArchiveOrigin;
use App\Enums\UserRole;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

class ArchiveAuthorizer
{
    public function assertCanIndex(User $user, bool $mine): void
    {
        if (! $mine && ! $user->isAdmin()) {
            abort(403, 'Only administrators can access the full archive.');
        }
    }

    public function assertCanAccessOperationalQueue(User $user): void
    {
        if (! in_array($user->role, [UserRole::Processor, UserRole::Accounting], true)) {
            abort(403, 'Only processor and accounting users can access the archive task queue.');
        }
    }

    public function assertCanCreate(User $user): void
    {
        if (! in_array($user->role, [UserRole::Admin, UserRole::Encoder], true)) {
            abort(403, 'Only administrators or encoders can upload archive records.');
        }
    }

    public function assertCanUpdate(User $user, ImportTransaction|ExportTransaction $transaction): void
    {
        $this->assertIsArchive($transaction);

        Gate::forUser($user)->authorize('update', $transaction);
    }

    public function assertCanUpdateStageApplicability(
        User $user,
        ImportTransaction|ExportTransaction $transaction,
        string $stage,
    ): void {
        $this->assertIsArchive($transaction);

        if ($user->isAdmin()) {
            return;
        }

        $allowedStages = match (true) {
            $transaction instanceof ImportTransaction && $user->role === UserRole::Processor => array_values(array_intersect(
                ImportTransaction::processorOperationalDocumentTypes(),
                ImportTransaction::optionalStageKeys(),
            )),
            $transaction instanceof ExportTransaction && $user->role === UserRole::Processor => array_values(array_intersect(
                ExportTransaction::processorOperationalDocumentTypes(),
                ExportTransaction::optionalStageKeys(),
            )),
            default => [],
        };

        if (! in_array($stage, $allowedStages, true)) {
            abort(403, 'You are not allowed to update this archive stage.');
        }
    }

    public function assertCanRollback(User $user, ImportTransaction|ExportTransaction $transaction): void
    {
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

    private function assertIsArchive(ImportTransaction|ExportTransaction $transaction): void
    {
        if (! $transaction->is_archive) {
            abort(404, 'Archive transaction not found.');
        }
    }
}
