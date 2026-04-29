<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use Illuminate\Support\Facades\Route;

// Login keeps the credential-specific lockout in LoginRequest and adds an
// IP-based route throttle here as a coarse abuse cap.
// No 'guest' middleware — SPA users with stale session cookies must be
// able to re-authenticate without being blocked.
Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('throttle:auth-login')
    ->name('login');

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth:sanctum')
    ->name('logout');
