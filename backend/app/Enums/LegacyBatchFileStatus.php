<?php

namespace App\Enums;

enum LegacyBatchFileStatus: string
{
    case Pending = 'pending';
    case Uploaded = 'uploaded';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Uploaded => 'Uploaded',
            self::Failed => 'Failed',
        };
    }
}
