<?php

namespace App\Queries\Transactions;

use App\Enums\UserRole;
use App\Models\ExportTransaction;
use App\Support\Transactions\ExportStatusWorkflow;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class ExportTransactionIndexQuery
{
    public function handle(Request $request): LengthAwarePaginator
    {
        $user = $request->user();

        $query = ExportTransaction::query()
            ->with(['shipper', 'stages', 'assignedUser', 'destinationCountry'])
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
                $query->where('bl_no', 'like', "%{$search}%")
                    ->orWhere('vessel', 'like', "%{$search}%")
                    ->orWhereHas('shipper', function ($query) use ($search) {
                        $query->where('name', 'like', "%{$search}%");
                    });

                $cleanSearch = str_replace('EXP-', '', $search);
                if (is_numeric($cleanSearch)) {
                    $query->orWhere('id', intval($cleanSearch));
                }
            });
        }

        if ($status = $request->query('status')) {
            $statuses = ExportStatusWorkflow::filterStatuses($status);
            count($statuses) === 1
                ? $query->where('status', $statuses[0])
                : $query->whereIn('status', $statuses);
        }

        if ($exclude = $request->query('exclude_statuses')) {
            $query->whereNotIn('status', ExportStatusWorkflow::normalizeList($exclude));
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
