<?php

namespace App\Queries\LegacyBatches;

use App\Http\Requests\LegacyBatches\LegacyBatchZipExportIndexRequest;
use App\Models\LegacyBatchZipExport;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class LegacyBatchZipExportIndexQuery
{
    /**
     * @return LengthAwarePaginator<int, LegacyBatchZipExport>
     */
    public function handle(LegacyBatchZipExportIndexRequest $request, User $user): LengthAwarePaginator
    {
        $query = LegacyBatchZipExport::query()
            ->whereHas('legacyBatch', fn (Builder $query): Builder => $query->visibleTo($user))
            ->with(['legacyBatch', 'requestedBy'])
            ->latest();

        if ($status = $request->status()) {
            $query->where('status', $status->value);
        }

        if ($module = $request->module()) {
            $query->whereHas(
                'legacyBatch',
                fn (Builder $query): Builder => $query->where('module', $module->value),
            );
        }

        return $query->paginate($request->perPage());
    }
}
