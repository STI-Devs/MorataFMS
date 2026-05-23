<?php

namespace App\Support\LegacyBatches;

use App\Enums\LegacyBatchModule;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchZipExport;
use App\Models\User;

class LegacyBatchAuthorizer
{
    public function authorizeAccess(User $user, ?string $module = null): void
    {
        if ($user->isAdmin()) {
            return;
        }

        if ($this->isLegalModule($module) && $user->hasLegalAccess()) {
            return;
        }

        if (($module === null || $module === LegacyBatchModule::Brokerage->value) && $user->role?->value === 'encoder') {
            return;
        }

        if ($module === null && $user->hasLegalAccess()) {
            return;
        }

        abort(403, 'You are not allowed to manage legacy batch uploads for this module.');
    }

    public function authorizeVisibility(User $user, LegacyBatch $legacyBatch): void
    {
        $this->authorizeAccess($user, $legacyBatch->module?->value);

        if ($user->isAdmin()) {
            return;
        }

        if ($this->isLegalModule($legacyBatch->module?->value) && $user->hasLegalAccess()) {
            return;
        }

        if ($legacyBatch->uploaded_by !== $user->id) {
            abort(403, 'You are not allowed to access this legacy batch.');
        }
    }

    public function authorizeZipExport(User $user, LegacyBatch $legacyBatch): void
    {
        $this->authorizeVisibility($user, $legacyBatch);

        if ($user->isAdmin()) {
            return;
        }

        if ($legacyBatch->uploaded_by === $user->id) {
            return;
        }

        abort(403, 'You can only prepare ZIP downloads for legacy batches you uploaded.');
    }

    public function authorizeZipExportIndex(User $user): void
    {
        if ($user->isAdmin() || $user->role?->value === 'encoder' || $user->hasLegalAccess()) {
            return;
        }

        abort(403, 'You are not allowed to view legacy batch ZIP downloads.');
    }

    public function authorizeZipExportAccess(User $user, LegacyBatchZipExport $legacyBatchZipExport): void
    {
        $legacyBatchZipExport->loadMissing('legacyBatch');

        if (! $legacyBatchZipExport->legacyBatch instanceof LegacyBatch) {
            abort(404, 'Legacy batch ZIP request was not found.');
        }

        $this->authorizeZipExport($user, $legacyBatchZipExport->legacyBatch);
    }

    private function isLegalModule(?string $module): bool
    {
        return in_array($module, [
            LegacyBatchModule::Legal->value,
            LegacyBatchModule::Notarial->value,
        ], true);
    }
}
