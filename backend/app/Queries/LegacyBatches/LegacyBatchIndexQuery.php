<?php

namespace App\Queries\LegacyBatches;

use App\Models\LegacyBatch;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class LegacyBatchIndexQuery
{
    public function handle(Request $request, User $user): LengthAwarePaginator
    {
        $search = trim((string) $request->query('search', ''));
        $perPage = in_array($request->integer('per_page', 20), [20, 50, 100], true)
            ? $request->integer('per_page', 20)
            : 20;

        $query = LegacyBatch::query()
            ->visibleTo($user)
            ->with('uploadedBy');

        if ($search !== '') {
            $query->where(function (Builder $searchQuery) use ($search): void {
                $searchQuery
                    ->where('batch_name', 'like', "%{$search}%")
                    ->orWhere('root_folder', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%")
                    ->orWhere('year_from', 'like', "%{$search}%")
                    ->orWhere('year_to', 'like', "%{$search}%")
                    ->orWhereHas('uploadedBy', function (Builder $userQuery) use ($search): void {
                        $userQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        return $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }
}
