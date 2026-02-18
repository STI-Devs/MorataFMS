<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
class ImportTransaction extends Model
{
    use HasFactory, Auditable;
    /**
     * NOTE: 'assigned_user_id' and 'status' are intentionally excluded.
     * They are server-managed and set explicitly in controllers.
     */
    protected $fillable = [
        'customs_ref_no',
        'bl_no',
        'selective_color',
        'importer_id',
        'origin_country_id',
        'arrival_date',
        'notes',
    ];

    protected $casts = [
        'arrival_date' => 'date',
    ];

    // Relationships
    public function importer(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'importer_id');
    }

    public function originCountry(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'origin_country_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function stages(): HasOne
    {
        return $this->hasOne(ImportStage::class);
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    // Boot method to auto-create stages
    protected static function booted(): void
    {
        static::created(function (ImportTransaction $transaction) {
            $transaction->stages()->create();
        });
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeInProgress($query)
    {
        return $query->where('status', 'in_progress');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    // Helper to get current stage progress
    public function getProgressAttribute(): array
    {
        $stages = $this->stages;
        if (!$stages)
            return [];

        return [
            'boc' => $stages->boc_status,
            'ppa' => $stages->ppa_status,
            'do' => $stages->do_status,
            'port_charges' => $stages->port_charges_status,
            'releasing' => $stages->releasing_status,
            'billing' => $stages->billing_status,
        ];
    }
}
