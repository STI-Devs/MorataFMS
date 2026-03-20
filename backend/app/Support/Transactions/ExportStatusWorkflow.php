<?php

namespace App\Support\Transactions;

use App\Enums\ExportStatus;

class ExportStatusWorkflow
{
    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return array_map(
            static fn (ExportStatus $status): string => $status->value,
            ExportStatus::cases(),
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
            'pending' => [ExportStatus::Pending->value],
            'in_progress' => [
                ExportStatus::InTransit->value,
                ExportStatus::Departure->value,
                ExportStatus::Processing->value,
            ],
            'completed' => [ExportStatus::Completed->value],
            'cancelled', 'canceled' => [ExportStatus::Cancelled->value],
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
            'pending' => ExportStatus::Pending->value,
            'in_transit', 'in transit' => ExportStatus::InTransit->value,
            'departure' => ExportStatus::Departure->value,
            'in_progress', 'processing' => ExportStatus::Processing->value,
            'completed' => ExportStatus::Completed->value,
            'cancelled', 'canceled' => ExportStatus::Cancelled->value,
            default => $status,
        };
    }

    public static function isCancellable(ExportStatus $status): bool
    {
        return in_array($status, [
            ExportStatus::Pending,
            ExportStatus::InTransit,
            ExportStatus::Departure,
            ExportStatus::Processing,
        ], true);
    }

    public static function completed(): string
    {
        return ExportStatus::Completed->value;
    }

    /**
     * @return list<string>
     */
    public static function inProgress(): array
    {
        return [
            ExportStatus::InTransit->value,
            ExportStatus::Departure->value,
            ExportStatus::Processing->value,
        ];
    }
}
