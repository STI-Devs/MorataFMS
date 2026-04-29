<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NotarialBook extends Model
{
    use Auditable, HasFactory;

    protected $fillable = [
        'book_number',
        'year',
        'status',
        'notes',
        'filename',
        'path',
        'disk',
        'mime_type',
        'size_bytes',
    ];

    protected $casts = [
        'book_number' => 'integer',
        'year' => 'integer',
        'size_bytes' => 'integer',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function pageScans(): HasMany
    {
        return $this->hasMany(NotarialPageScan::class, 'notarial_book_id');
    }

    public function legacyFiles(): HasMany
    {
        return $this->hasMany(NotarialLegacyFile::class, 'notarial_book_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function templateRecords(): HasMany
    {
        return $this->hasMany(NotarialTemplateRecord::class, 'notarial_book_id');
    }

    public function getFormattedSizeAttribute(): ?string
    {
        if ($this->size_bytes === null) {
            return null;
        }

        if ($this->size_bytes < 1024) {
            return $this->size_bytes.' B';
        }

        if ($this->size_bytes < 1048576) {
            return round($this->size_bytes / 1024, 2).' KB';
        }

        return round($this->size_bytes / 1048576, 2).' MB';
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForYear($query, int $year)
    {
        return $query->where('year', $year);
    }
}
