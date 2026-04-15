<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Document extends Model
{
    use Auditable, HasFactory;

    private const STORAGE_ROOT = 'transaction-documents';

    /**
     * @return list<string>
     */
    public static function importTypeKeys(): array
    {
        return [
            'boc',
            'bonds',
            'ppa',
            'do',
            'port_charges',
            'releasing',
            'billing',
            'others',
        ];
    }

    /**
     * @return list<string>
     */
    public static function exportTypeKeys(): array
    {
        return [
            'boc',
            'bl_generation',
            'phytosanitary',
            'co',
            'cil',
            'dccci',
            'billing',
            'others',
        ];
    }

    /**
     * @return list<string>
     */
    public static function importOptionalTypeKeys(): array
    {
        return ['bonds', 'ppa', 'port_charges'];
    }

    /**
     * @return list<string>
     */
    public static function exportOptionalTypeKeys(): array
    {
        return ['phytosanitary', 'co', 'dccci'];
    }

    /**
     * @return list<string>
     */
    public static function allowedTypeKeysFor(?string $documentableType): array
    {
        return match ($documentableType) {
            ImportTransaction::class => self::importTypeKeys(),
            ExportTransaction::class => self::exportTypeKeys(),
            default => [],
        };
    }

    public static function isAllowedTypeFor(?string $documentableType, string $type): bool
    {
        return in_array($type, self::allowedTypeKeysFor($documentableType), true);
    }

    /**
     * @return list<string>
     */
    public static function optionalTypeKeysFor(?string $documentableType): array
    {
        return match ($documentableType) {
            ImportTransaction::class => self::importOptionalTypeKeys(),
            ExportTransaction::class => self::exportOptionalTypeKeys(),
            default => [],
        };
    }

    /**
     * @param  list<string>  $notApplicableStageKeys
     * @return list<string>
     */
    public static function requiredTypeKeysFor(
        ?string $documentableType,
        array $notApplicableStageKeys = [],
    ): array {
        return array_values(array_filter(
            self::allowedTypeKeysFor($documentableType),
            fn (string $typeKey): bool => $typeKey !== 'others'
                && ! in_array($typeKey, $notApplicableStageKeys, true),
        ));
    }

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

    public function scopeVisibleTo($query, User $user)
    {
        if (! $user->hasBrokerageAccess()) {
            return $query->whereRaw('1 = 0');
        }

        if ($user->isAdmin()) {
            return $query;
        }

        if ($user->role === UserRole::Encoder) {
            return $query->where(function ($documentQuery) use ($user) {
                $documentQuery
                    ->whereHasMorph('documentable', [ImportTransaction::class], function ($transactionQuery) use ($user) {
                        $transactionQuery->visibleTo($user);
                    })
                    ->orWhereHasMorph('documentable', [ExportTransaction::class], function ($transactionQuery) use ($user) {
                        $transactionQuery->visibleTo($user);
                    });
            });
        }

        if (in_array($user->role, [UserRole::Processor, UserRole::Accounting], true)) {
            return $query->where(function ($documentQuery) use ($user) {
                $documentQuery
                    ->where('uploaded_by', $user->id)
                    ->orWhereHasMorph('documentable', [ImportTransaction::class], function ($transactionQuery) use ($user) {
                        $transactionQuery->relevantToOperationalQueue($user);
                    })
                    ->orWhereHasMorph('documentable', [ExportTransaction::class], function ($transactionQuery) use ($user) {
                        $transactionQuery->relevantToOperationalQueue($user);
                    });
            });
        }

        return $query->whereRaw('1 = 0');
    }

    // Helper to get human-readable file size
    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->size_bytes;
        if ($bytes < 1024) {
            return $bytes.' B';
        }
        if ($bytes < 1048576) {
            return round($bytes / 1024, 2).' KB';
        }

        return round($bytes / 1048576, 2).' MB';
    }

    // Helper to generate S3 path for transaction documents.
    // Archive state lives in the database and S3 object tags, not in the root prefix.
    // Path: {root}/{folder}/{year}/{period-folder}/{BL}/{type}_{name}_{unique}.{ext}
    public static function generateS3Path(
        string $documentableType,
        int $documentableId,
        string $type,
        string $filename,
        string $blNo = '',
        int $year = 0,
        int $month = 0,
    ): string {
        $root = self::STORAGE_ROOT;
        $folder = str_contains($documentableType, 'Import') ? 'imports' : 'exports';
        $year = $year ?: now()->year;
        $month = $month ?: now()->month;
        $periodFolder = self::periodFolder($month);
        $blSlug = $blNo
            ? str($blNo)->slug('-')->upper()->value()
            : (string) $documentableId;
        $basename = pathinfo($filename, PATHINFO_FILENAME);
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $safeName = str($basename)->slug('_')->value();
        $unique = substr(uniqid(), -6); // short unique suffix to prevent overwrites

        return "{$root}/{$folder}/{$year}/{$periodFolder}/{$blSlug}/{$type}_{$safeName}_{$unique}.{$ext}";
    }

    // Document type labels
    public static function getTypeLabels(): array
    {
        return [
            // Import stages
            'boc' => 'BOC Document Processing',
            'bonds' => 'BONDS',
            'phytosanitary' => 'Phytosanitary Certificates',
            'ppa' => 'Payment for PPA Charges',
            'do' => 'Delivery Order Request',
            'port_charges' => 'Payment for Port Charges',
            'releasing' => 'Releasing of Documents',
            'billing' => 'Liquidation and Billing',
            // Export stages
            'bl_generation' => 'Bill of Lading',
            'cil' => 'CIL',
            'co' => 'CO Application',
            'dccci' => 'DCCCI Printing',
            // Shared — catch-all for additional documents
            'others' => 'Other Documents',
        ];
    }

    private static function periodFolder(int $month): string
    {
        $monthPad = str_pad($month, 2, '0', STR_PAD_LEFT);
        $monthName = date('F', mktime(0, 0, 0, $month, 1));

        return "month-{$monthPad}-{$monthName}";
    }
}
