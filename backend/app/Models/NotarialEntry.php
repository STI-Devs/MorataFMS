<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class NotarialEntry extends Model
{
    use HasFactory, Auditable;

    /**
     * NOTE: 'notarial_book_id' and 'created_by' are intentionally excluded —
     * they must be set by controller logic to prevent ownership spoofing.
     */
    protected $fillable = [
        'doc_number',
        'document_type',
        'document_type_other',
        'title',
        'client_id',
        'signer_names',
        'id_type',
        'id_number',
        'notary_fee',
        'notarized_at',
        'notes',
    ];

    protected $casts = [
        'doc_number' => 'integer',
        'notary_fee' => 'decimal:2',
        'notarized_at' => 'datetime',
    ];

    // Valid document types
    public const DOCUMENT_TYPES = [
        'affidavit',
        'power_of_attorney',
        'real_estate',
        'business_doc',
        'position_paper',
        'other',
    ];

    // Human-readable labels for document types
    public static function getDocumentTypeLabels(): array
    {
        return [
            'affidavit' => 'Affidavit / Oath',
            'power_of_attorney' => 'Power of Attorney',
            'real_estate' => 'Real Estate Document',
            'business_doc' => 'Business Document',
            'position_paper' => 'Position Paper',
            'other' => 'Other',
        ];
    }

    // --- Relationships ---

    public function book(): BelongsTo
    {
        return $this->belongsTo(NotarialBook::class, 'notarial_book_id');
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Documents (uploads) attached to this notarial entry.
     * Uses the existing polymorphic Document system.
     */
    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
