<?php

namespace App\Enums;

enum CountryType: string
{
    case ImportOrigin      = 'import_origin';
    case ExportDestination = 'export_destination';
    case Both              = 'both';

    public function label(): string
    {
        return match($this) {
            self::ImportOrigin      => 'Import Origin',
            self::ExportDestination => 'Export Destination',
            self::Both              => 'Both',
        };
    }
}
