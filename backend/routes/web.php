<?php

use App\Http\Controllers\SystemController;
use Illuminate\Support\Facades\Route;

Route::get('/up', [SystemController::class, 'health']);
Route::get('/', [SystemController::class, 'index']);
