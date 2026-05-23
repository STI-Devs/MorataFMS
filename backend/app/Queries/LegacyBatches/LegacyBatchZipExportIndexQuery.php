<?php

namespace App\Queries\LegacyBatches;

use App\Data\LegacyBatches\LegacyBatchZipExportIndexFilters;
use App\Models\LegacyBatchZipExport;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class LegacyBatchZipExportIndexQuery
{
    /**
     * @return LengthAwarePaginator<int, LegacyBatchZipExport>
     */
    public function handle(LegacyBatchZipExportIndexFilters $filters, User $user): LengthAwarePaginator
    {
        $query = LegacyBatchZipExport::query()
            ->whereHas('legacyBatch', fn (Builder $query): Builder => $query->visibleTo($user))
            ->with(['legacyBatch', 'requestedBy'])
            ->latest();

        if (! $user->isAdmin()) {
            $query->whereHas(
                'legacyBatch',
                fn (Builder $query): Builder => $query->where('uploaded_by', $user->id),
            );
        }

        if ($status = $filters->status) {
            $query->where('status', $status->value);
        }

        if ($module = $filters->module) {
            $query->whereHas(
                'legacyBatch',
                fn (Builder $query): Builder => $query->where('module', $module->value),
            );
        }

        return $query->paginate($filters->perPage);
    }
}
