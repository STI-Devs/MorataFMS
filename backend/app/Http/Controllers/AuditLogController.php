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
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', AuditLog::class);

        $query = AuditLog::with('user');

        if ($type = $request->query('auditable_type')) {
            $fullType = 'App\\Models\\' . $type;
            $query->where('auditable_type', $fullType);
        }

        if ($id = $request->query('auditable_id')) {
            $query->where('auditable_id', $id);
        }

        if ($event = $request->query('event')) {
            $query->where('event', $event);
        }

        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        // Date range filters
        if ($from = $request->query('from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        // Search filter
        if ($search = $request->query('search')) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->input('per_page', 25), 100);

        $logs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return AuditLogResource::collection($logs);
    }

    /**
     * GET /api/audit-logs/actions
     * Returns distinct event types for use in filter dropdowns.
     */
    public function actions(Request $request)
    {
        $this->authorize('viewAny', AuditLog::class);

        $actions = AuditLog::distinct()->orderBy('event')->pluck('event');

        return response()->json(['data' => $actions]);
    }
}
