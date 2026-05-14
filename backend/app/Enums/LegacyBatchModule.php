<?php

namespace App\Enums;

enum LegacyBatchModule: string
{
    case Brokerage = 'brokerage';
    case Notarial = 'notarial';
    case Legal = 'legal';

    public function label(): string
    {
        return match ($this) {
            self::Brokerage => 'Brokerage',
            self::Notarial => 'Notarial',
            self::Legal => 'Legal',
        };
    }
}
