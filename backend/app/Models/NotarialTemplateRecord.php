<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotarialTemplateRecord extends Model
{
    use Auditable, HasFactory;

    protected $fillable = [
        'notarial_template_id',
        'notarial_book_id',
        'template_code',
        'template_label',
        'document_code',
        'document_category',
        'notarial_act_type',
        'party_name',
        'template_data',
        'notes',
        'filename',
        'path',
        'disk',
        'mime_type',
        'size_bytes',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'template_data' => 'array',
            'size_bytes' => 'integer',
            'generated_at' => 'datetime',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(NotarialTemplate::class, 'notarial_template_id');
    }

    public function book(): BelongsTo
    {
        return $this->belongsTo(NotarialBook::class, 'notarial_book_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getFormattedSizeAttribute(): string
    {
        if ($this->size_bytes < 1024) {
            return $this->size_bytes.' B';
        }

        if ($this->size_bytes < 1048576) {
            return round($this->size_bytes / 1024, 2).' KB';
        }

        return round($this->size_bytes / 1048576, 2).' MB';
    }
}
