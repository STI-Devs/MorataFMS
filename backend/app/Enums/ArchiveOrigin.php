<?php

namespace App\Enums;

enum ArchiveOrigin: string
{
    case DirectArchiveUpload = 'direct_archive_upload';
    case ArchivedFromLive = 'archived_from_live';

    public function label(): string
    {
        return match ($this) {
            self::DirectArchiveUpload => 'Direct Archive Upload',
            self::ArchivedFromLive => 'Archived From Live',
        };
    }
}
