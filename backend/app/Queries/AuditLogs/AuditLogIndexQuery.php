<?php

namespace App\Queries\AuditLogs;

use App\Models\AuditLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class AuditLogIndexQuery
{
    public function handle(Request $request): LengthAwarePaginator
    {
        $query = AuditLog::with(['user', 'auditable']);

        if ($type = $request->query('auditable_type')) {
            $query->where('auditable_type', 'App\\Models\\'.$type);
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

        match ($request->query('actor', 'human')) {
            'human' => $query->whereNotNull('user_id'),
            'system' => $query->whereNull('user_id'),
            default => null,
        };

        if ($from = $request->query('from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        if ($search = $request->query('search')) {
            $query->whereHas('user', function ($userQuery) use ($search) {
                $userQuery->where('name', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) $request->input('per_page', 25), 100);

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function actions(): Collection
    {
        return AuditLog::query()
            ->distinct()
            ->orderBy('event')
            ->pluck('event');
    }
}
