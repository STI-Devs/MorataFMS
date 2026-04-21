<?php

namespace App\Models;

use App\Enums\LegacyBatchFileStatus;
use App\Traits\Auditable;
use Database\Factories\LegacyBatchFileFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LegacyBatchFile extends Model
{
    /** @use HasFactory<LegacyBatchFileFactory> */
    use Auditable, HasFactory;

    protected $fillable = [
        'legacy_batch_id',
        'relative_path',
        'relative_path_hash',
        'storage_path',
        'filename',
        'mime_type',
        'size_bytes',
        'modified_at',
        'status',
        'uploaded_at',
        'failed_at',
        'failure_reason',
    ];

    protected function casts(): array
    {
        return [
            'size_bytes' => 'integer',
            'modified_at' => 'datetime',
            'uploaded_at' => 'datetime',
            'failed_at' => 'datetime',
            'status' => LegacyBatchFileStatus::class,
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (self $legacyBatchFile): void {
            $legacyBatchFile->relative_path_hash = hash('sha256', (string) $legacyBatchFile->relative_path);
        });
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(LegacyBatch::class, 'legacy_batch_id');
    }
}
