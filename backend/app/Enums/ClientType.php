<?php

namespace App\Enums;

enum ClientType: string
{
    case Importer = 'importer';
    case Exporter = 'exporter';
    case Both     = 'both';

    public function label(): string
    {
        return match($this) {
            self::Importer => 'Importer',
            self::Exporter => 'Exporter',
            self::Both     => 'Both',
        };
    }
}
