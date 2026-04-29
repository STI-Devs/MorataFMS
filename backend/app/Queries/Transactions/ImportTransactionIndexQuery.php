<?php

namespace App\Queries\Transactions;

use App\Enums\UserRole;
use App\Models\ImportTransaction;
use App\Support\Transactions\ImportStatusWorkflow;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class ImportTransactionIndexQuery
{
    public function handle(Request $request): LengthAwarePaginator
    {
        $user = $request->user();

        $query = ImportTransaction::query()
            ->with(['importer', 'originCountry', 'locationOfGoods', 'stages', 'assignedUser'])
            ->withCount(['remarks as open_remarks_count' => fn ($query) => $query->where('is_resolved', false)])
            ->withCount('documents');

        if (in_array($user->role, [UserRole::Processor, UserRole::Accounting], true)) {
            if ($request->query('operational_scope') === 'workspace') {
                $query->relevantToOperationalWorkspace($user);
            } else {
                $query->relevantToOperationalQueue($user);
            }
        } else {
            $query->visibleTo($user);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($query) use ($search) {
                $query->where('customs_ref_no', 'like', "%{$search}%")
                    ->orWhere('bl_no', 'like', "%{$search}%")
                    ->orWhereHas('importer', function ($query) use ($search) {
                        $query->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($status = $request->query('status')) {
            $statuses = ImportStatusWorkflow::filterStatuses($status);
            count($statuses) === 1
                ? $query->where('status', $statuses[0])
                : $query->whereIn('status', $statuses);
        }

        if ($exclude = $request->query('exclude_statuses')) {
            $query->whereNotIn('status', ImportStatusWorkflow::normalizeList($exclude));
        }

        if ($color = $request->query('selective_color')) {
            $query->where('selective_color', $color);
        }

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1) {
            $perPage = 1;
        }
        if ($perPage > 500) {
            $perPage = 500;
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }
}
