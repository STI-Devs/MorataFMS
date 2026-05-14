<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NotarialTemplate extends Model
{
    use Auditable, HasFactory;

    protected $fillable = [
        'module',
        'code',
        'label',
        'document_code',
        'document_category',
        'default_notarial_act_type',
        'description',
        'is_active',
        'filename',
        'path',
        'disk',
        'mime_type',
        'size_bytes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'size_bytes' => 'integer',
        ];
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by')->withTrashed();
    }

    public function generatedDocuments(): HasMany
    {
        return $this->hasMany(NotarialGeneratedDocument::class);
    }

    public function isLegalModule(): bool
    {
        return $this->module === 'legal';
    }

    public function hasSourceFile(): bool
    {
        return (bool) $this->path;
    }

    public function getFormattedSizeAttribute(): ?string
    {
        if ($this->size_bytes === null) {
            return null;
        }

        if ($this->size_bytes < 1024) {
            return $this->size_bytes.' B';
        }

        if ($this->size_bytes < 1048576) {
            return round($this->size_bytes / 1024, 2).' KB';
        }

        return round($this->size_bytes / 1048576, 2).' MB';
    }
}
