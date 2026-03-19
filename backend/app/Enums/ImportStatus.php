<?php

namespace App\Enums;

/**
 * Transaction-level status for import shipments.
 * Stored as VARCHAR in DB (was ENUM, converted to VARCHAR to allow
 * human-readable labels without MySQL case-sensitivity conflicts).
 *
 * Ladder: Pending → Vessel Arrived → Processing → Completed
 */
enum ImportStatus: string
{
    case Pending       = 'Pending';
    case VesselArrived = 'Vessel Arrived';
    case Processing    = 'Processing';
    case Completed     = 'Completed';
    case Cancelled     = 'Cancelled';

    public function label(): string
    {
        return $this->value;
    }

    public function isTerminal(): bool
    {
        return $this === self::Completed || $this === self::Cancelled;
    }
}
