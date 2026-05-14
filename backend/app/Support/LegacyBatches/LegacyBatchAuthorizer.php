<?php

namespace App\Support\LegacyBatches;

use App\Enums\LegacyBatchModule;
use App\Models\LegacyBatch;
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

    private function isLegalModule(?string $module): bool
    {
        return in_array($module, [
            LegacyBatchModule::Legal->value,
            LegacyBatchModule::Notarial->value,
        ], true);
    }
}
