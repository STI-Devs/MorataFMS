<?php

namespace App\Support\Archives;

use App\Enums\ArchiveZipExportStatus;
use App\Models\ArchiveZipExport;
use App\Models\LegacyBatchZipExport;
use App\Models\User;

class ZipExportRequestQuota
{
    public const MAX_ACTIVE_REQUESTS_PER_USER = 5;

    public function assertCanCreateFor(User $user): void
    {
        if ($this->activeCountFor($user) < self::MAX_ACTIVE_REQUESTS_PER_USER) {
            return;
        }

        abort(429, 'You can only keep 5 active ZIP requests at a time. Clear finished ZIP requests before preparing another one.');
    }

    private function activeCountFor(User $user): int
    {
        return $this->activeArchiveZipExportCount($user) + $this->activeLegacyBatchZipExportCount($user);
    }

    private function activeArchiveZipExportCount(User $user): int
    {
        return ArchiveZipExport::query()
            ->whereBelongsTo($user, 'requestedBy')
            ->whereIn('status', $this->activeStatuses())
            ->where(function ($query): void {
                $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->count();
    }

    private function activeLegacyBatchZipExportCount(User $user): int
    {
        return LegacyBatchZipExport::query()
            ->whereBelongsTo($user, 'requestedBy')
            ->whereIn('status', $this->activeStatuses())
            ->where(function ($query): void {
                $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->count();
    }

    /**
     * @return list<string>
     */
    private function activeStatuses(): array
    {
        return [
            ArchiveZipExportStatus::Pending->value,
            ArchiveZipExportStatus::Processing->value,
            ArchiveZipExportStatus::Ready->value,
        ];
    }
}
