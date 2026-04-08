<?php

namespace App\Models;

use App\Enums\ArchiveOrigin;
use App\Enums\ImportStatus;
use App\Enums\SelectiveColor;
use App\Enums\StageStatus;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class ImportTransaction extends Model
{
    use Auditable, HasFactory;

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
        'is_archive' => 'boolean',
        'archived_at' => 'datetime',
        'archive_origin' => ArchiveOrigin::class,
        'status' => ImportStatus::class,
        'selective_color' => SelectiveColor::class,
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

    public function archivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    public function stages(): HasOne
    {
        return $this->hasOne(ImportStage::class);
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function remarks(): MorphMany
    {
        return $this->morphMany(TransactionRemark::class, 'remarkble');
    }

    protected static function booted(): void
    {
        static::created(function (ImportTransaction $transaction) {
            $transaction->stages()->create();
        });
    }

    /**
     * Recalculate stage and transaction statuses based on uploaded documents.
     * Called automatically by DocumentController after every upload or delete.
     */
    public function recalculateStatus(): void
    {
        // Map of document type → ImportStage field name
        $stageMap = [
            'boc' => 'boc',
            'ppa' => 'ppa',
            'do' => 'do',
            'port_charges' => 'port_charges',
            'releasing' => 'releasing',
            'billing' => 'billing',
        ];

        // Get all uploaded document types for this transaction
        $docTypes = $this->documents()->pluck('type')->toArray();

        // Update per-stage statuses on the stages record
        $stages = $this->stages;
        if ($stages) {
            $stageUpdates = [];
            foreach ($stageMap as $docType => $stageKey) {
                $hasDoc = in_array($docType, $docTypes);
                $completedAtField = "{$stageKey}_completed_at";
                $stageUpdates["{$stageKey}_status"] = $hasDoc ? StageStatus::Completed->value : StageStatus::Pending->value;
                $stageUpdates[$completedAtField] = $hasDoc ? ($stages->$completedAtField ?? now()) : null;
            }
            $stages->update($stageUpdates);
        }

        // Derive overall transaction status from highest completed stage
        if (in_array('billing', $docTypes)) {
            $newStatus = ImportStatus::Completed;
        } elseif (array_intersect(['ppa', 'do', 'port_charges', 'releasing'], $docTypes)) {
            $newStatus = ImportStatus::Processing;
        } elseif (in_array('boc', $docTypes)) {
            $newStatus = ImportStatus::VesselArrived;
        } else {
            $newStatus = ImportStatus::Pending;
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
        return $query->where('status', ImportStatus::Pending->value);
    }

    public function scopeInProgress($query)
    {
        return $query->whereIn('status', [
            ImportStatus::VesselArrived->value,
            ImportStatus::Processing->value,
        ]);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', ImportStatus::Completed->value);
    }

    public function scopeVisibleTo($query, User $user)
    {
        if ($user->isAdmin()) {
            return $query;
        }

        return $query->where('assigned_user_id', $user->id);
    }

    // Helper to get current stage progress
    public function getProgressAttribute(): array
    {
        $stages = $this->stages;
        if (! $stages) {
            return [];
        }

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
