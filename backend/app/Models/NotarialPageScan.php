<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotarialPageScan extends Model
{
    use Auditable, HasFactory;

    protected $fillable = [
        'page_start',
        'page_end',
        'filename',
        'path',
        'disk',
        'mime_type',
        'size_bytes',
    ];

    protected $casts = [
        'page_start' => 'integer',
        'page_end' => 'integer',
        'size_bytes' => 'integer',
    ];

    public function book(): BelongsTo
    {
        return $this->belongsTo(NotarialBook::class, 'notarial_book_id');
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function covers(int $pageNumber): bool
    {
        return $pageNumber >= $this->page_start && $pageNumber <= $this->page_end;
    }

    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size_bytes ?? 0;

        if ($bytes < 1024) {
            return $bytes.' B';
        }

        if ($bytes < 1048576) {
            return round($bytes / 1024, 2).' KB';
        }

        return round($bytes / 1048576, 2).' MB';
    }

    public function getPageRangeLabelAttribute(): string
    {
        if ($this->page_start === $this->page_end) {
            return 'Page '.$this->page_start;
        }

        return 'Pages '.$this->page_start.'–'.$this->page_end;
    }
}
