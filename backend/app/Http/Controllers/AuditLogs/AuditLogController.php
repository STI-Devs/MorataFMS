<?php

namespace App\Http\Controllers\AuditLogs;

use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogs\AuditLogResource;
use App\Models\AuditLog;
use App\Queries\AuditLogs\AuditLogIndexQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AuditLogController extends Controller
{
    public function __construct(
        private AuditLogIndexQuery $auditLogIndexQuery,
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', AuditLog::class);

        return AuditLogResource::collection($this->auditLogIndexQuery->handle($request))
            ->additional([
                'summary' => $this->auditLogIndexQuery->summary($request),
            ]);
    }

    public function actions(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AuditLog::class);

        return response()->json([
            'data' => $this->auditLogIndexQuery->actions($request),
        ]);
    }
}
