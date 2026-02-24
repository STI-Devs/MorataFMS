<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ExportTransactionController;
use App\Http\Controllers\ImportTransactionController;
use App\Http\Controllers\UserController;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    require __DIR__ . '/auth.php';
});

Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::get('/user', function (Request $request) {
        return new UserResource($request->user());
    });

    Route::get('import-transactions/stats', [ImportTransactionController::class, 'stats']);
    Route::get('export-transactions/stats', [ExportTransactionController::class, 'stats']);
    Route::patch('import-transactions/{import_transaction}/cancel', [ImportTransactionController::class, 'cancel']);
    Route::patch('export-transactions/{export_transaction}/cancel', [ExportTransactionController::class, 'cancel']);
    Route::apiResource('import-transactions', ImportTransactionController::class)->only(['index', 'store', 'destroy']);
    Route::apiResource('export-transactions', ExportTransactionController::class)->only(['index', 'store', 'destroy']);
    Route::get('/clients', [ClientController::class, 'index']);
    Route::get('/countries', [CountryController::class, 'index']);

    // Document management
    Route::apiResource('documents', DocumentController::class)->except(['update']);
    Route::get('documents/{document}/download', [DocumentController::class, 'download']);

    // Admin-only routes — tighter throttle (20 req/min) for heavier DB queries
    Route::middleware('throttle:20,1')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::apiResource('clients', ClientController::class)->except(['index']);

        // Audit logs (read-only, supervisor+)
        Route::get('audit-logs', [AuditLogController::class, 'index']);
        Route::get('audit-logs/actions', [AuditLogController::class, 'actions']);
    });
});