<?php

namespace App\Models;

use App\Enums\ArchiveZipExportStatus;
use Database\Factories\LegacyBatchZipExportFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class LegacyBatchZipExport extends Model
{
    /** @use HasFactory<LegacyBatchZipExportFactory> */
    use HasFactory;

    public const EXPIRATION_HOURS = 72;

    protected $fillable = [
        'uuid',
        'legacy_batch_id',
        'requested_by',
        'status',
        'storage_disk',
        'file_path',
        'filename',
        'file_size_bytes',
        'file_count',
        'error_message',
        'started_at',
        'completed_at',
        'expires_at',
    ];

    protected $attributes = [
        'status' => 'pending',
        'file_size_bytes' => 0,
        'file_count' => 0,
    ];

    protected function casts(): array
    {
        return [
            'status' => ArchiveZipExportStatus::class,
            'file_size_bytes' => 'integer',
            'file_count' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $legacyBatchZipExport): void {
            $legacyBatchZipExport->uuid ??= (string) Str::uuid();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function legacyBatch(): BelongsTo
    {
        return $this->belongsTo(LegacyBatch::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by')->withTrashed();
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isDownloadable(): bool
    {
        return $this->status === ArchiveZipExportStatus::Ready
            && $this->file_path !== null
            && ! $this->isExpired();
    }
}
