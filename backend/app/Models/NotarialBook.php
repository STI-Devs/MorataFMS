<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NotarialBook extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'book_number',
        'year',
    ];

    protected $casts = [
        'book_number' => 'integer',
        'year' => 'integer',
        'entries_count' => 'integer',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    // --- Relationships ---

    public function entries(): HasMany
    {
        return $this->hasMany(NotarialEntry::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // --- Helpers ---

    /**
     * Check if the book has reached its capacity of 525 entries.
     */
    public function isFull(): bool
    {
        return $this->entries_count >= 525;
    }

    /**
     * Get the next available doc number in this book.
     */
    public function getNextDocNumber(): int
    {
        $lastDoc = $this->entries()->max('doc_number');
        return ($lastDoc ?? 0) + 1;
    }

    // --- Scopes ---

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForYear($query, int $year)
    {
        return $query->where('year', $year);
    }
}
