<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LegalParty extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'principal_address',
    ];

    public function notarialGeneratedDocuments(): HasMany
    {
        return $this->hasMany(NotarialGeneratedDocument::class, 'legal_party_id');
    }
}
