<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Document extends Model
{
    use HasFactory, Auditable;
    /**
     * NOTE: 'documentable_type', 'documentable_id', and 'uploaded_by' are
     * intentionally excluded — they must be set by controller logic to prevent
     * polymorphic type injection and ownership spoofing.
     */
    protected $fillable = [
        'type',
        'filename',
        'path',
        'size_bytes',
        'version',
    ];

    protected $casts = [
        'size_bytes' => 'integer',
        'version' => 'integer',
    ];

    // Polymorphic relationship
    public function documentable(): MorphTo
    {
        return $this->morphTo();
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // Helper to get human-readable file size
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size_bytes;
        if ($bytes < 1024)
            return $bytes . ' B';
        if ($bytes < 1048576)
            return round($bytes / 1024, 2) . ' KB';
        return round($bytes / 1048576, 2) . ' MB';
    }

    // Helper to generate S3 path for documents
    public static function generateS3Path(
        string $documentableType,
        int $documentableId,
        string $type,
        string $filename
    ): string {
        $transactionType = str($documentableType)
            ->afterLast('\\')
            ->snake()
            ->value();
        $timestamp = now()->timestamp;
        $safeName = str($filename)->slug('_')->value();

        return "documents/{$transactionType}/{$documentableId}/{$type}_{$timestamp}_{$safeName}";
    }

    // Document type labels
    public static function getTypeLabels(): array
    {
        return [
            'invoice' => 'Invoice',
            'packing_list' => 'Packing List',
            'bl' => 'Bill of Lading',
            'co' => 'Certificate of Origin',
            'cil' => 'Certificate of Inspection & Loading',
            'phytosanitary' => 'Phytosanitary Certificate',
            'export_declaration' => 'Export Declaration',
            'import_entry' => 'Import Entry',
            'delivery_order' => 'Delivery Order',
            'other' => 'Other',
        ];
    }
}
