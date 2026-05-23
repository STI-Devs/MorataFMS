<?php

namespace App\Queries\Archives;

use App\Http\Requests\Archives\ArchiveZipExportIndexRequest;
use App\Models\ArchiveZipExport;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ArchiveZipExportIndexQuery
{
    /**
     * @return LengthAwarePaginator<int, ArchiveZipExport>
     */
    public function handle(ArchiveZipExportIndexRequest $request, User $user): LengthAwarePaginator
    {
        $query = ArchiveZipExport::query()
            ->visibleTo($user)
            ->with('requestedBy')
            ->latest();

        if ($status = $request->status()) {
            $query->where('status', $status->value);
        }

        if ($request->mine() !== null) {
            $query->where('mine', $request->mine());
        }

        return $query->paginate($request->perPage());
    }
}
