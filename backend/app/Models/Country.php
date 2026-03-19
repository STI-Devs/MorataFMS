<?php

namespace App\Models;

use App\Enums\CountryType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    use HasFactory;
    protected $fillable = [
        'name',
        'code',
        'type',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'type'      => CountryType::class,
    ];

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }

    public function exportTransactions(): HasMany
    {
        return $this->hasMany(ExportTransaction::class, 'destination_country_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeImportOrigins($query)
    {
        return $query->whereIn('type', [CountryType::ImportOrigin->value, CountryType::Both->value]);
    }

    public function scopeExportDestinations($query)
    {
        return $query->whereIn('type', [CountryType::ExportDestination->value, CountryType::Both->value]);
    }
}
