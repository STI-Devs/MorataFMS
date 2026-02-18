<?php

namespace App\Http\Controllers;

use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * GET /api/audit-logs
     * Paginated list of audit logs with optional filters.
     *
     * Filters:
     *   ?search=keyword      — search in event/description (new_values->description)
     *   ?action=login        — filter by event/action name
     *   ?user_id=1           — filter by who performed the action
     *   ?date_from=YYYY-MM-DD
     *   ?date_to=YYYY-MM-DD
     *   ?auditable_type=ImportTransaction
     *   ?auditable_id=5
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', AuditLog::class);

        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

        // Search in event name or description stored in new_values
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('event', 'like', "%{$search}%")
                    ->orWhereRaw("JSON_EXTRACT(new_values, '$.description') LIKE ?", ["%{$search}%"])
                    ->orWhereHas('user', fn($u) => $u->where('name', 'like', "%{$search}%"));
            });
        }

        // Filter by action/event name
        if ($action = $request->query('action')) {
            $query->where('event', $action);
        }

        // Filter by user
        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        // Date range
        if ($dateFrom = $request->query('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->query('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        // Filter by model type (accepts short name like "ImportTransaction")
        if ($type = $request->query('auditable_type')) {
            $fullType = 'App\\Models\\' . $type;
            $query->where('auditable_type', $fullType);
        }

        // Filter by specific record
        if ($id = $request->query('auditable_id')) {
            $query->where('auditable_id', $id);
        }

        $perPage = min((int) $request->input('per_page', 25), 100);

        $logs = $query->paginate($perPage);

        return AuditLogResource::collection($logs)->additional([
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /**
     * GET /api/audit-logs/actions
     * Returns distinct event/action names for filter dropdown.
     */
    public function actions()
    {
        $this->authorize('viewAny', AuditLog::class);

        $actions = AuditLog::select('event')
            ->distinct()
            ->orderBy('event')
            ->pluck('event');

        return response()->json(['data' => $actions]);
    }
}
