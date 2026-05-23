<?php

namespace App\Queries\AuditLogs;

use App\Models\ArchiveZipExport;
use App\Models\AuditLog;
use App\Models\LegacyBatchFile;
use App\Models\LegacyBatchZipExport;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class AuditLogIndexQuery
{
    private const OPERATIONAL_AUDIT_TYPES = [
        ArchiveZipExport::class,
        LegacyBatchFile::class,
        LegacyBatchZipExport::class,
    ];

    public function handle(Request $request): LengthAwarePaginator
    {
        return $this->filteredQuery($request)
            ->with(['user', 'auditable'])
            ->orderByDesc('created_at')
            ->paginate($this->perPage($request));
    }

    /**
     * @return array{total: int, created: int, updated: int, deleted: int}
     */
    public function summary(Request $request): array
    {
        $summary = $this->filteredQuery($request)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN event = 'created' THEN 1 ELSE 0 END) as created")
            ->selectRaw("SUM(CASE WHEN event = 'updated' THEN 1 ELSE 0 END) as updated")
            ->selectRaw("SUM(CASE WHEN event = 'deleted' THEN 1 ELSE 0 END) as deleted")
            ->first();

        return [
            'total' => (int) ($summary->total ?? 0),
            'created' => (int) ($summary->created ?? 0),
            'updated' => (int) ($summary->updated ?? 0),
            'deleted' => (int) ($summary->deleted ?? 0),
        ];
    }

    public function actions(Request $request): Collection
    {
        return $this->filteredQuery($request, includeEvent: false)
            ->distinct()
            ->orderBy('event')
            ->pluck('event');
    }

    /**
     * @return Builder<AuditLog>
     */
    private function filteredQuery(Request $request, bool $includeEvent = true): Builder
    {
        $query = AuditLog::query();

        if ($type = $request->query('auditable_type')) {
            $query->where('auditable_type', 'App\\Models\\'.$type);
        }

        match ($request->query('category', 'all')) {
            'business' => $query->whereNotIn('auditable_type', self::OPERATIONAL_AUDIT_TYPES),
            'operational' => $query->whereIn('auditable_type', self::OPERATIONAL_AUDIT_TYPES),
            default => null,
        };

        if ($id = $request->query('auditable_id')) {
            $query->where('auditable_id', $id);
        }

        if ($includeEvent && $event = $request->query('event')) {
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
            $query->where('created_at', '>=', CarbonImmutable::parse($from)->startOfDay());
        }

        if ($to = $request->query('to')) {
            $query->where('created_at', '<', CarbonImmutable::parse($to)->addDay()->startOfDay());
        }

        if ($search = $request->query('search')) {
            $query->whereHas('user', function ($userQuery) use ($search) {
                $userQuery->where('name', 'like', "%{$search}%");
            });
        }

        return $query;
    }

    private function perPage(Request $request): int
    {
        return min((int) $request->input('per_page', 25), 100);
    }
}
