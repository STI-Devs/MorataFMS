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
    // $isArchive controls root prefix: archives/ vs documents/
    // Path: {root}/{folder}/{year}/{MM-Month}/{BL}/{type}_{name}_{unique}.{ext}
    public static function generateS3Path(
        string $documentableType,
        int $documentableId,
        string $type,
        string $filename,
        string $blNo = '',
        int $year = 0,
        bool $isArchive = false,
        int $month = 0,
    ): string {
        $root = $isArchive ? 'archives' : 'documents';
        $folder = str_contains($documentableType, 'Import') ? 'imports' : 'exports';
        $year = $year ?: now()->year;
        $month = $month ?: now()->month;
        $monthPad = str_pad($month, 2, '0', STR_PAD_LEFT);
        $monthName = date('F', mktime(0, 0, 0, $month, 1));
        $blSlug = $blNo
            ? str($blNo)->slug('-')->upper()->value()
            : (string) $documentableId;
        $basename = pathinfo($filename, PATHINFO_FILENAME);
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $safeName = str($basename)->slug('_')->value();
        $unique = substr(uniqid(), -6); // short unique suffix to prevent overwrites

        return "{$root}/{$folder}/{$year}/{$monthPad}-{$monthName}/{$blSlug}/{$type}_{$safeName}_{$unique}.{$ext}";
    }

    // Document type labels
    public static function getTypeLabels(): array
    {
        return [
            // Import stages
            'boc' => 'BOC Document Processing',
            'ppa' => 'Payment for PPA Charges',
            'do' => 'Delivery Order Request',
            'port_charges' => 'Payment for Port Charges',
            'releasing' => 'Releasing of Documents',
            'billing' => 'Liquidation and Billing',
            // Export stages
            'bl_generation' => 'Bill of Lading Generation',
            'co' => 'CO Application and Releasing',
            'dccci' => 'DCCCI Printing',
        ];
    }
}
