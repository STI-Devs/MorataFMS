<?php

namespace App\Queries\LegacyBatches;

use App\Enums\LegacyBatchModule;
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
        $module = $this->moduleFilter($request);
        $perPage = in_array($request->integer('per_page', 20), [20, 50, 100], true)
            ? $request->integer('per_page', 20)
            : 20;

        $query = LegacyBatch::query()
            ->visibleTo($user)
            ->with(['uploadedBy', 'latestZipExport.requestedBy']);

        if ($module !== null) {
            $query->where('module', $module->value);
        }

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
                    ->orWhereIn(
                        'uploaded_by',
                        User::query()->where('name', 'like', "%{$search}%")->select('id'),
                    );
            });
        }

        return $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
    }

    private function moduleFilter(Request $request): ?LegacyBatchModule
    {
        $module = $request->query('module');

        if (! is_string($module) || trim($module) === '') {
            return null;
        }

        return LegacyBatchModule::tryFrom(trim($module));
    }
}
