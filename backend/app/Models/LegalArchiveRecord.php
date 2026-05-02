<?php

namespace App\Models;

use App\Support\Legal\LegalDocumentCatalog;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LegalArchiveRecord extends Model
{
    use Auditable, HasFactory;

    protected $fillable = [
        'file_category',
        'file_code',
        'title',
        'related_name',
        'document_date',
        'notes',
        'filename',
        'path',
        'disk',
        'mime_type',
        'size_bytes',
    ];

    /**
     * @return list<string>
     */
    public static function categoryCodes(): array
    {
        return array_column(LegalDocumentCatalog::legalFileCategories(), 'code');
    }

    /**
     * @return list<string>
     */
    public static function fileCodes(): array
    {
        return LegalDocumentCatalog::legalFileCodes();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
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

    protected function casts(): array
    {
        return [
            'document_date' => 'date',
            'size_bytes' => 'integer',
        ];
    }
}
