<?php

namespace App\Http\Controllers;

use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use App\Queries\AuditLogs\AuditLogIndexQuery;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function __construct(
        private AuditLogIndexQuery $auditLogIndexQuery,
    ) {}

    /**
     * GET /api/audit-logs
     * Paginated list of audit logs with optional filters.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', AuditLog::class);

        $logs = $this->auditLogIndexQuery->handle($request);

        return AuditLogResource::collection($logs);
    }

    /**
     * GET /api/audit-logs/actions
     * Returns distinct event types for use in filter dropdowns.
     */
    public function actions(Request $request)
    {
        $this->authorize('viewAny', AuditLog::class);

        return response()->json([
            'data' => $this->auditLogIndexQuery->actions(),
        ]);
    }
}
