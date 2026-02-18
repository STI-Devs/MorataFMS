<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class ExportTransaction extends Model
{
    use HasFactory, Auditable;
    /**
     * NOTE: 'assigned_user_id' and 'status' are intentionally excluded.
     * They are server-managed and set explicitly in controllers.
     */
    protected $fillable = [
        'shipper_id',
        'bl_no',
        'vessel',
        'destination_country_id',
        'notes',
    ];

    // Relationships
    public function shipper(): BelongsTo
    {
        return $this->belongsTo(Client::class, 'shipper_id');
    }

    public function destinationCountry(): BelongsTo
    {
        return $this->belongsTo(Country::class, 'destination_country_id');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function stages(): HasOne
    {
        return $this->hasOne(ExportStage::class);
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    // Boot method to auto-create stages
    protected static function booted(): void
    {
        static::created(function (ExportTransaction $transaction) {
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
            'docs_prep' => $stages->docs_prep_status,
            'co' => $stages->co_status,
            'cil' => $stages->cil_status,
            'bl' => $stages->bl_status,
        ];
    }
}
