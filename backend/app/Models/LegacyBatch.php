<?php

namespace App\Models;

use App\Enums\LegacyBatchFileStatus;
use App\Enums\LegacyBatchModule;
use App\Enums\LegacyBatchStatus;
use App\Traits\Auditable;
use Database\Factories\LegacyBatchFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class LegacyBatch extends Model
{
    /** @use HasFactory<LegacyBatchFactory> */
    use Auditable, HasFactory;

    protected $fillable = [
        'uuid',
        'batch_name',
        'root_folder',
        'year',
        'year_from',
        'year_to',
        'department',
        'module',
        'notes',
        'status',
        'expected_file_count',
        'uploaded_file_count',
        'failed_file_count',
        'total_size_bytes',
        'storage_disk',
        'uploaded_by',
        'started_at',
        'completed_at',
        'last_activity_at',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'year_from' => 'integer',
            'year_to' => 'integer',
            'expected_file_count' => 'integer',
            'uploaded_file_count' => 'integer',
            'failed_file_count' => 'integer',
            'total_size_bytes' => 'integer',
            'module' => LegacyBatchModule::class,
            'status' => LegacyBatchStatus::class,
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'last_activity_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function files(): HasMany
    {
        return $this->hasMany(LegacyBatchFile::class);
    }

    public function zipExports(): HasMany
    {
        return $this->hasMany(LegacyBatchZipExport::class);
    }

    public function latestZipExport(): HasOne
    {
        return $this->hasOne(LegacyBatchZipExport::class)->latestOfMany();
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by')->withTrashed();
    }

    public function scopeVisibleTo($query, User $user)
    {
        if ($user->isAdmin()) {
            return $query;
        }

        if ($user->role?->value === 'encoder') {
            return $query
                ->where('uploaded_by', $user->id)
                ->where('module', LegacyBatchModule::Brokerage->value);
        }

        if ($user->hasLegalAccess()) {
            return $query->whereIn('module', [
                LegacyBatchModule::Legal->value,
                LegacyBatchModule::Notarial->value,
            ]);
        }

        return $query->whereRaw('1 = 0');
    }

    public function syncProgressCounts(): self
    {
        $uploadedCount = $this->files()
            ->where('status', LegacyBatchFileStatus::Uploaded->value)
            ->count();

        $failedCount = $this->files()
            ->where('status', LegacyBatchFileStatus::Failed->value)
            ->count();

        $this->forceFill([
            'uploaded_file_count' => $uploadedCount,
            'failed_file_count' => $failedCount,
            'last_activity_at' => now(),
        ])->save();

        return $this;
    }

    public function pendingFileCount(): int
    {
        return max($this->expected_file_count - $this->uploaded_file_count, 0);
    }

    public function effectiveYearFrom(): int
    {
        return (int) ($this->year_from ?? $this->year);
    }

    public function effectiveYearTo(): int
    {
        return (int) ($this->year_to ?? $this->year);
    }

    public function coverageYearLabel(): string
    {
        $yearFrom = $this->effectiveYearFrom();
        $yearTo = $this->effectiveYearTo();

        if ($yearFrom === $yearTo) {
            return (string) $yearFrom;
        }

        return "{$yearFrom} - {$yearTo}";
    }
}
