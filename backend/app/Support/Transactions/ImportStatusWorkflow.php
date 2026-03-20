<?php

namespace App\Support\Transactions;

use App\Enums\ImportStatus;

class ImportStatusWorkflow
{
    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return array_map(
            static fn (ImportStatus $status): string => $status->value,
            ImportStatus::cases(),
        );
    }

    /**
     * @return list<string>
     */
    public static function filterStatuses(?string $status): array
    {
        if ($status === null || $status === '') {
            return [];
        }

        return match (strtolower(trim($status))) {
            'pending' => [ImportStatus::Pending->value],
            'in_progress' => [
                ImportStatus::VesselArrived->value,
                ImportStatus::Processing->value,
            ],
            'completed' => [ImportStatus::Completed->value],
            'cancelled', 'canceled' => [ImportStatus::Cancelled->value],
            default => [self::normalize($status) ?? $status],
        };
    }

    /**
     * @return list<string>
     */
    public static function normalizeList(?string $statuses): array
    {
        if ($statuses === null || trim($statuses) === '') {
            return [];
        }

        $normalized = [];

        foreach (explode(',', $statuses) as $status) {
            foreach (self::filterStatuses($status) as $value) {
                $normalized[] = $value;
            }
        }

        return array_values(array_unique($normalized));
    }

    public static function normalize(?string $status): ?string
    {
        if ($status === null) {
            return null;
        }

        return match (strtolower(trim($status))) {
            'pending' => ImportStatus::Pending->value,
            'vessel_arrived', 'vessel arrived' => ImportStatus::VesselArrived->value,
            'in_progress', 'processing' => ImportStatus::Processing->value,
            'completed' => ImportStatus::Completed->value,
            'cancelled', 'canceled' => ImportStatus::Cancelled->value,
            default => $status,
        };
    }

    public static function isCancellable(ImportStatus $status): bool
    {
        return in_array($status, [
            ImportStatus::Pending,
            ImportStatus::VesselArrived,
            ImportStatus::Processing,
        ], true);
    }

    public static function completed(): string
    {
        return ImportStatus::Completed->value;
    }

    /**
     * @return list<string>
     */
    public static function inProgress(): array
    {
        return [
            ImportStatus::VesselArrived->value,
            ImportStatus::Processing->value,
        ];
    }
}
