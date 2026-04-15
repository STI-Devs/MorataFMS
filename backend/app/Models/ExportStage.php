<?php

namespace App\Models;

use App\Enums\StageStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExportStage extends Model
{
    protected $fillable = [
        'export_transaction_id',
        // Docs Preparation
        'docs_prep_status',
        'docs_prep_completed_at',
        'docs_prep_completed_by',
        // C.O (Certificate of Origin)
        'co_status',
        'co_completed_at',
        'co_completed_by',
        'co_not_applicable',
        // Phytosanitary
        'phytosanitary_status',
        'phytosanitary_completed_at',
        'phytosanitary_completed_by',
        'phytosanitary_not_applicable',
        // CIL
        'cil_status',
        'cil_completed_at',
        'cil_completed_by',
        // DCCCI
        'dccci_status',
        'dccci_completed_at',
        'dccci_completed_by',
        'dccci_not_applicable',
        // BL (Bill of Lading)
        'bl_status',
        'bl_completed_at',
        'bl_completed_by',
        // Billing
        'billing_status',
        'billing_completed_at',
        'billing_completed_by',
    ];

    protected $casts = [
        'docs_prep_completed_at' => 'datetime',
        'co_completed_at' => 'datetime',
        'phytosanitary_completed_at' => 'datetime',
        'cil_completed_at' => 'datetime',
        'dccci_completed_at' => 'datetime',
        'bl_completed_at' => 'datetime',
        'billing_completed_at' => 'datetime',
        'docs_prep_status' => StageStatus::class,
        'co_status' => StageStatus::class,
        'phytosanitary_status' => StageStatus::class,
        'cil_status' => StageStatus::class,
        'dccci_status' => StageStatus::class,
        'bl_status' => StageStatus::class,
        'billing_status' => StageStatus::class,
        'co_not_applicable' => 'boolean',
        'phytosanitary_not_applicable' => 'boolean',
        'dccci_not_applicable' => 'boolean',
    ];

    // Relationships
    public function exportTransaction(): BelongsTo
    {
        return $this->belongsTo(ExportTransaction::class);
    }

    public function docsPrepCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'docs_prep_completed_by');
    }

    public function coCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'co_completed_by');
    }

    public function phytosanitaryCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'phytosanitary_completed_by');
    }

    public function cilCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cil_completed_by');
    }

    public function dccciCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dccci_completed_by');
    }

    public function blCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'bl_completed_by');
    }

    public function billingCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'billing_completed_by');
    }

    // Helper methods
    public function markStageComplete(string $stage, int $userId): void
    {
        $statusField = "{$stage}_status";
        $completedAtField = "{$stage}_completed_at";
        $completedByField = "{$stage}_completed_by";

        $this->update([
            $statusField => 'completed',
            $completedAtField => now(),
            $completedByField => $userId,
        ]);
    }

    public function getCompletedStagesCount(): int
    {
        $stages = ['docs_prep', 'bl', 'phytosanitary', 'co', 'cil', 'dccci', 'billing'];
        $count = 0;

        foreach ($stages as $stage) {
            if ($this->{"{$stage}_status"} === StageStatus::Completed) {
                $count++;
            }
        }

        return $count;
    }

    public function isAllComplete(): bool
    {
        return $this->getCompletedStagesCount() === 7;
    }
}
