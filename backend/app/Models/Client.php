<?php

namespace App\Models;

use App\Enums\ClientType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'type',
        'country_id',
        'contact_person',
        'contact_email',
        'contact_phone',
        'address',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'type'      => ClientType::class,
    ];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function importTransactions(): HasMany
    {
        return $this->hasMany(ImportTransaction::class, 'importer_id');
    }

    public function exportTransactions(): HasMany
    {
        return $this->hasMany(ExportTransaction::class, 'shipper_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeImporters($query)
    {
        return $query->whereIn('type', [ClientType::Importer->value, ClientType::Both->value]);
    }

    public function scopeExporters($query)
    {
        return $query->whereIn('type', [ClientType::Exporter->value, ClientType::Both->value]);
    }

    public function scopeNotarial($query)
    {
        return $query->whereIn('type', ['notarial', 'all']);
    }

    /**
     * Scope to only brokerage-relevant client types (hides 'notarial' from brokerage UI).
     */
    public function scopeForBrokerage($query)
    {
        return $query->whereIn('type', ['importer', 'exporter', 'both', 'all']);
    }

    // Notarial entries
    public function notarialEntries(): HasMany
    {
        return $this->hasMany(NotarialEntry::class);
    }
}
