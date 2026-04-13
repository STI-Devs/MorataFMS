<?php

namespace App\Support\Operations\Deletion\Shared;

use App\Models\AuditLog;

class PurgesAuditLogsForSubjects
{
    /**
     * @param  array<string, list<int>>  $subjects
     */
    public function delete(array $subjects): int
    {
        if ($subjects === []) {
            return 0;
        }

        $query = AuditLog::query()->where(function ($builder) use ($subjects): void {
            foreach ($subjects as $type => $ids) {
                if ($ids === []) {
                    continue;
                }

                $builder->orWhere(function ($subjectQuery) use ($type, $ids): void {
                    $subjectQuery
                        ->where('auditable_type', $type)
                        ->whereIn('auditable_id', $ids);
                });
            }
        });

        $count = (clone $query)->count();

        $query->delete();

        return $count;
    }
}
