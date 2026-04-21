<?php

namespace App\Enums;

enum LegacyBatchStatus: string
{
    case Draft = 'draft';
    case Uploading = 'uploading';
    case Interrupted = 'interrupted';
    case Processing = 'processing';
    case Completed = 'completed';
    case Failed = 'failed';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Uploading => 'Uploading',
            self::Interrupted => 'Interrupted',
            self::Processing => 'Processing',
            self::Completed => 'Complete',
            self::Failed => 'Failed',
        };
    }
}
