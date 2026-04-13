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

    /**
     * @return array<string, string>
     */
    public static function documentStageMap(): array
    {
        return [
            'boc' => 'boc',
            'bonds' => 'bonds',
            'phytosanitary' => 'phytosanitary',
            'ppa' => 'ppa',
            'do' => 'do',
            'port_charges' => 'port_charges',
            'releasing' => 'releasing',
            'billing' => 'billing',
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function optionalStageFlagMap(): array
    {
        return [
            'bonds' => 'bonds_not_applicable',
        ];
    }

    /**
     * @return list<string>
     */
    public static function optionalStageKeys(): array
    {
        return array_keys(self::optionalStageFlagMap());
    }

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
        $stageMap = self::documentStageMap();
        $optionalStageFlags = self::optionalStageFlagMap();
        $docTypes = $this->documents()->pluck('type')->toArray();
        $stages = $this->stages;

        if ($stages) {
            $stageUpdates = [];

            foreach ($stageMap as $docType => $stageKey) {
                $hasDoc = in_array($docType, $docTypes, true);
                $notApplicable = isset($optionalStageFlags[$docType])
                    ? (bool) $stages->{$optionalStageFlags[$docType]}
                    : false;
                $completedAtField = "{$stageKey}_completed_at";
                $stageUpdates["{$stageKey}_status"] = $hasDoc || $notApplicable
                    ? StageStatus::Completed->value
                    : StageStatus::Pending->value;
                $stageUpdates[$completedAtField] = $hasDoc || $notApplicable
                    ? ($stages->$completedAtField ?? now())
                    : null;
            }

            $stages->update($stageUpdates);
        }

        if ($this->is_archive) {
            $newStatus = ImportStatus::Completed;
        } elseif (in_array('billing', $docTypes, true)) {
            $newStatus = ImportStatus::Completed;
        } elseif (collect(['bonds', 'phytosanitary', 'ppa', 'do', 'port_charges', 'releasing'])
            ->contains(fn (string $stage): bool => in_array($stage, $docTypes, true))) {
            $newStatus = ImportStatus::Processing;
        } elseif (in_array('boc', $docTypes, true)) {
            $newStatus = ImportStatus::VesselArrived;
        } else {
            $newStatus = ImportStatus::Pending;
        }

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

        return collect(self::documentStageMap())
            ->mapWithKeys(fn (string $stageKey, string $documentType) => [
                $documentType => $stages->{"{$stageKey}_status"},
            ])
            ->all();
    }

    /**
     * @return list<string>
     */
    public function notApplicableStageKeys(): array
    {
        $stages = $this->stages;

        if (! $stages) {
            return [];
        }

        return collect(self::optionalStageFlagMap())
            ->filter(fn (string $flagField) => (bool) $stages->{$flagField})
            ->keys()
            ->values()
            ->all();
    }

    /**
     * @return list<string>
     */
    public function requiredDocumentTypeKeys(): array
    {
        return Document::requiredTypeKeysFor(self::class, $this->notApplicableStageKeys());
    }

    public function isStageNotApplicable(string $stage): bool
    {
        $flagField = self::optionalStageFlagMap()[$stage] ?? null;

        if ($flagField === null || ! $this->stages) {
            return false;
        }

        return (bool) $this->stages->{$flagField};
    }

    public function setStageApplicability(string $stage, bool $notApplicable, int $userId): void
    {
        $flagField = self::optionalStageFlagMap()[$stage] ?? null;
        $stageKey = self::documentStageMap()[$stage] ?? null;

        if ($flagField === null || $stageKey === null) {
            return;
        }

        $stages = $this->stages()->firstOrCreate();
        $hasStageDocument = $this->documents()->where('type', $stage)->exists();

        $updates = [
            $flagField => $notApplicable,
        ];

        if ($notApplicable) {
            $updates["{$stageKey}_status"] = StageStatus::Completed->value;
            $updates["{$stageKey}_completed_at"] = $stages->{"{$stageKey}_completed_at"} ?? now();
            $updates["{$stageKey}_completed_by"] = $userId;
        } elseif (! $hasStageDocument) {
            $updates["{$stageKey}_status"] = StageStatus::Pending->value;
            $updates["{$stageKey}_completed_at"] = null;
            $updates["{$stageKey}_completed_by"] = null;
        }

        $stages->update($updates);
        $this->unsetRelation('stages');
    }
}
