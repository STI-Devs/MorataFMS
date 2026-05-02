<?php

namespace App\Models;

use App\Enums\StageStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImportStage extends Model
{
    protected $fillable = [
        'import_transaction_id',
        // BOC
        'boc_status',
        'boc_completed_at',
        'boc_completed_by',
        // Bonds
        'bonds_status',
        'bonds_completed_at',
        'bonds_completed_by',
        'bonds_not_applicable',
        // PPA
        'ppa_status',
        'ppa_completed_at',
        'ppa_completed_by',
        'ppa_not_applicable',
        // DO
        'do_status',
        'do_completed_at',
        'do_completed_by',
        // Port Charges
        'port_charges_status',
        'port_charges_completed_at',
        'port_charges_completed_by',
        'port_charges_not_applicable',
        // Releasing
        'releasing_status',
        'releasing_completed_at',
        'releasing_completed_by',
        // Billing
        'billing_status',
        'billing_completed_at',
        'billing_completed_by',
    ];

    public function importTransaction(): BelongsTo
    {
        return $this->belongsTo(ImportTransaction::class);
    }

    public function bocCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'boc_completed_by');
    }

    public function bondsCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'bonds_completed_by');
    }

    public function ppaCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ppa_completed_by');
    }

    public function doCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'do_completed_by');
    }

    public function portChargesCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'port_charges_completed_by');
    }

    public function releasingCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'releasing_completed_by');
    }

    public function billingCompletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'billing_completed_by');
    }

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
        $stages = ['boc', 'bonds', 'ppa', 'do', 'port_charges', 'releasing', 'billing'];
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

    protected function casts(): array
    {
        return [
            'boc_completed_at' => 'datetime',
            'bonds_completed_at' => 'datetime',
            'ppa_completed_at' => 'datetime',
            'do_completed_at' => 'datetime',
            'port_charges_completed_at' => 'datetime',
            'releasing_completed_at' => 'datetime',
            'billing_completed_at' => 'datetime',
            'boc_status' => StageStatus::class,
            'bonds_status' => StageStatus::class,
            'ppa_status' => StageStatus::class,
            'do_status' => StageStatus::class,
            'port_charges_status' => StageStatus::class,
            'releasing_status' => StageStatus::class,
            'billing_status' => StageStatus::class,
            'bonds_not_applicable' => 'boolean',
            'ppa_not_applicable' => 'boolean',
            'port_charges_not_applicable' => 'boolean',
        ];
    }
}
