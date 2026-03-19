<?php

namespace App\Models;

use App\Enums\ExportStatus;
use App\Enums\StageStatus;
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

    protected $casts = [
        'export_date' => 'date',
        'is_archive'  => 'boolean',
        'status'      => ExportStatus::class,
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

    public function remarks(): MorphMany
    {
        return $this->morphMany(TransactionRemark::class, 'remarkble');
    }

    // Boot method to auto-create stages
    protected static function booted(): void
    {
        static::created(function (ExportTransaction $transaction) {
            $transaction->stages()->create();
        });
    }

    /**
     * Recalculate stage and transaction statuses based on uploaded documents.
     * Called automatically by DocumentController after every upload or delete.
     */
    public function recalculateStatus(): void
    {
        // Map of document type → ExportStage field name
        $stageMap = [
            'boc'          => 'docs_prep',
            'bl_generation' => 'bl',
            'co'           => 'co',
            'dccci'        => 'cil',
            'billing'      => 'bl', // billing reuses bl slot for the last stage
        ];

        // Get all uploaded document types for this transaction
        $docTypes = $this->documents()->pluck('type')->toArray();

        // Update per-stage statuses on the stages record
        $stages = $this->stages;
        if ($stages) {
            $stageUpdates = [];
            foreach ($stageMap as $docType => $stageKey) {
                $hasDoc           = in_array($docType, $docTypes);
                $completedAtField = "{$stageKey}_completed_at";
                // Only override with 'completed' not back to 'pending' if already set by another docType
                if ($hasDoc) {
                    $stageUpdates["{$stageKey}_status"] = StageStatus::Completed->value;
                    $stageUpdates[$completedAtField]    = $stages->$completedAtField ?? now();
                } elseif (!isset($stageUpdates["{$stageKey}_status"])) {
                    $stageUpdates["{$stageKey}_status"] = StageStatus::Pending->value;
                    $stageUpdates[$completedAtField]    = null;
                }
            }
            $stages->update($stageUpdates);
        }

        // Derive overall transaction status from highest completed stage
        if (in_array('billing', $docTypes)) {
            $newStatus = ExportStatus::Completed;
        } elseif (array_intersect(['co', 'dccci'], $docTypes)) {
            $newStatus = ExportStatus::Processing;
        } elseif (in_array('bl_generation', $docTypes)) {
            $newStatus = ExportStatus::Departure;
        } elseif (in_array('boc', $docTypes)) {
            $newStatus = ExportStatus::InTransit;
        } else {
            $newStatus = ExportStatus::Pending;
        }

        // Only update if status actually changed (prevents audit noise)
        if ($this->status !== $newStatus) {
            $this->status = $newStatus;
            $this->saveQuietly();
        }
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', ExportStatus::Pending->value);
    }

    public function scopeInProgress($query)
    {
        return $query->whereIn('status', [
            ExportStatus::InTransit->value,
            ExportStatus::Departure->value,
            ExportStatus::Processing->value,
        ]);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', ExportStatus::Completed->value);
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
