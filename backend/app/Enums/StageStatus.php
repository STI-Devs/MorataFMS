<?php

namespace App\Enums;

/**
 * Shared per-stage status used by both ImportStage and ExportStage.
 * Each stage column (boc_status, ppa_status, etc.) is cast to this enum.
 */
enum StageStatus: string
{
    case Pending    = 'pending';
    case InProgress = 'in_progress';
    case Completed  = 'completed';

    public function isCompleted(): bool
    {
        return $this === self::Completed;
    }

    public function label(): string
    {
        return match($this) {
            self::Pending    => 'Pending',
            self::InProgress => 'In Progress',
            self::Completed  => 'Completed',
        };
    }
}
