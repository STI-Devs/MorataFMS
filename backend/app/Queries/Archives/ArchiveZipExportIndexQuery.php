<?php

namespace App\Queries\Archives;

use App\Data\Archives\ArchiveZipExportIndexFilters;
use App\Models\ArchiveZipExport;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ArchiveZipExportIndexQuery
{
    /**
     * @return LengthAwarePaginator<int, ArchiveZipExport>
     */
    public function handle(ArchiveZipExportIndexFilters $filters, User $user): LengthAwarePaginator
    {
        $query = ArchiveZipExport::query()
            ->visibleTo($user)
            ->with('requestedBy')
            ->latest();

        if ($status = $filters->status) {
            $query->where('status', $status->value);
        }

        if ($filters->mine !== null) {
            $query->where('mine', $filters->mine);
        }

        return $query->paginate($filters->perPage);
    }
}
