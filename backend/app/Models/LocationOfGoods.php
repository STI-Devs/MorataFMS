<?php

namespace App\Models;

use Database\Factories\LocationOfGoodsFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LocationOfGoods extends Model
{
    /** @use HasFactory<LocationOfGoodsFactory> */
    use HasFactory;

    protected $table = 'locations_of_goods';

    protected $fillable = [
        'name',
        'is_active',
    ];

    public function importTransactions(): HasMany
    {
        return $this->hasMany(ImportTransaction::class);
    }

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
