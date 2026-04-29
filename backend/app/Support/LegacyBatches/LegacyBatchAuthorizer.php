<?php

namespace App\Support\LegacyBatches;

use App\Models\LegacyBatch;
use App\Models\User;

class LegacyBatchAuthorizer
{
    public function authorizeAccess(User $user): void
    {
        if ($user->isAdmin() || $user->role?->value === 'encoder') {
            return;
        }

        abort(403, 'Only administrators or encoders can manage legacy batch uploads.');
    }

    public function authorizeVisibility(User $user, LegacyBatch $legacyBatch): void
    {
        $this->authorizeAccess($user);

        if ($user->isAdmin()) {
            return;
        }

        if ($legacyBatch->uploaded_by !== $user->id) {
            abort(403, 'You are not allowed to access this legacy batch.');
        }
    }
}
