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
     *   ?auditable_type=ImportTransaction   — filter by model name
     *   ?auditable_id=5                     — filter by specific record
     *   ?event=updated                      — filter by event type
     *   ?user_id=1                          — filter by who performed the action
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', AuditLog::class);

        $query = AuditLog::with('user');

        // Filter by model type (accepts short name like "ImportTransaction")
        if ($type = $request->query('auditable_type')) {
            $fullType = 'App\\Models\\' . $type;
            $query->where('auditable_type', $fullType);
        }

        // Filter by specific record
        if ($id = $request->query('auditable_id')) {
            $query->where('auditable_id', $id);
        }

        // Filter by event type
        if ($event = $request->query('event')) {
            $query->where('event', $event);
        }

        // Filter by user
        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        $perPage = $request->input('per_page', 25);
        if ($perPage > 100)
            $perPage = 100;

        $logs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return AuditLogResource::collection($logs);
    }
}
