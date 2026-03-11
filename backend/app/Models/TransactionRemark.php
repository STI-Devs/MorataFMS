<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class TransactionRemark extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'remarkble_type',
        'remarkble_id',
        'author_id',
        'severity',
        'message',
        'document_id',
    ];

    protected $casts = [
        'is_resolved' => 'boolean',
        'resolved_at' => 'datetime',
    ];

    // ── Relationships ────────────────────────────────────────────────────────

    /** The transaction this remark belongs to (polymorphic). */
    public function remarkble(): MorphTo
    {
        return $this->morphTo();
    }

    /** The admin who created the remark. */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /** The user who resolved the remark (admin or encoder). */
    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    /** Optional: the specific document this remark is pinned to. */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    // ── Scopes ───────────────────────────────────────────────────────────────

    public function scopeOpen($query)
    {
        return $query->where('is_resolved', false);
    }

    public function scopeResolved($query)
    {
        return $query->where('is_resolved', true);
    }
}
