<?php

namespace App\Enums;

/**
 * Transaction-level status for export shipments.
 * Stored as VARCHAR in DB.
 *
 * Ladder: Pending → In Transit → Departure → Processing → Completed
 */
enum ExportStatus: string
{
    case Pending    = 'Pending';
    case InTransit  = 'In Transit';
    case Departure  = 'Departure';
    case Processing = 'Processing';
    case Completed  = 'Completed';
    case Cancelled  = 'Cancelled';

    public function label(): string
    {
        return $this->value;
    }

    public function isTerminal(): bool
    {
        return $this === self::Completed || $this === self::Cancelled;
    }
}
