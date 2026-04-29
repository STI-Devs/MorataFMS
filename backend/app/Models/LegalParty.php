<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LegalParty extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'principal_address',
    ];
}
