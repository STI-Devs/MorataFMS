<?php

namespace App\Models;

use App\Enums\ArchiveZipExportScope;
use App\Enums\ArchiveZipExportStatus;
use App\Traits\Auditable;
use Database\Factories\ArchiveZipExportFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ArchiveZipExport extends Model
{
    /** @use HasFactory<ArchiveZipExportFactory> */
    use Auditable, HasFactory;

    public const EXPIRATION_HOURS = 72;

    protected $fillable = [
        'uuid',
        'requested_by',
        'scope',
        'year',
        'month',
        'type',
        'mine',
        'status',
        'storage_disk',
        'file_path',
        'filename',
        'file_size_bytes',
        'file_count',
        'bl_count',
        'error_message',
        'started_at',
        'completed_at',
        'expires_at',
    ];

    protected $attributes = [
        'scope' => 'folder',
        'mine' => false,
        'status' => 'pending',
        'file_size_bytes' => 0,
        'file_count' => 0,
        'bl_count' => 0,
    ];

    protected function casts(): array
    {
        return [
            'scope' => ArchiveZipExportScope::class,
            'year' => 'integer',
            'month' => 'integer',
            'mine' => 'boolean',
            'status' => ArchiveZipExportStatus::class,
            'file_size_bytes' => 'integer',
            'file_count' => 'integer',
            'bl_count' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $archiveZipExport): void {
            $archiveZipExport->uuid ??= (string) Str::uuid();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by')->withTrashed();
    }

    /**
     * @param  Builder<ArchiveZipExport>  $query
     * @return Builder<ArchiveZipExport>
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        return $query->whereBelongsTo($user, 'requestedBy');
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
