<?php

use App\Enums\UserRole;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('transactions.user.{id}', function (User $user, int|string $id): bool {
    return (int) $user->getKey() === (int) $id;
});

Broadcast::channel('transactions.{type}.{id}', function (User $user, string $type, int|string $id): bool {
    if ($user->isAdmin()) {
        return true;
    }

    if ($user->role !== UserRole::Encoder) {
        return false;
    }

    $assignedUserId = match (strtolower(trim($type))) {
        'import' => ImportTransaction::query()->whereKey($id)->value('assigned_user_id'),
        'export' => ExportTransaction::query()->whereKey($id)->value('assigned_user_id'),
        default => null,
    };

    return (int) $assignedUserId === (int) $user->getKey();
});
