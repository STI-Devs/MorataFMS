<?php

namespace App\Enums;

enum ArchiveZipExportScope: string
{
    case Folder = 'folder';
    case Year = 'year';

    public function label(): string
    {
        return match ($this) {
            self::Folder => 'Folder',
            self::Year => 'Year',
        };
    }
}
