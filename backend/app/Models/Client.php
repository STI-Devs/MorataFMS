<?php

namespace App\Models;

use App\Enums\ClientType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory;

    protected $table = 'brokerage_clients';

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

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'type' => ClientType::class,
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeImporters(Builder $query): Builder
    {
        return $query->whereIn('type', [ClientType::Importer->value, ClientType::Both->value]);
    }

    public function scopeExporters(Builder $query): Builder
    {
        return $query->whereIn('type', [ClientType::Exporter->value, ClientType::Both->value]);
    }
}
