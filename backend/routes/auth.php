<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;

// Login keeps the credential-specific lockout in LoginRequest and adds an
// IP-based route throttle here as a coarse abuse cap.
// No 'guest' middleware — SPA users with stale session cookies must be
// able to re-authenticate without being blocked.
Route::post('/login', [AuthenticatedSessionController::class, 'store'])
    ->middleware('throttle:auth-login')
    ->name('login');

Route::get('/verify-email/{id}/{hash}', VerifyEmailController::class)
    ->middleware(['auth', 'signed', 'throttle:auth-verification'])
    ->name('verification.verify');

Route::post('/email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
    ->middleware(['auth:sanctum', 'throttle:auth-verification'])
    ->name('verification.send');

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth:sanctum')
    ->name('logout');
