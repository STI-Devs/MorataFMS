<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminDocumentReviewController;
use App\Http\Controllers\ArchiveController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CountryController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ExportTransactionController;
use App\Http\Controllers\ImportTransactionController;
use App\Http\Controllers\NotarialBookController;
use App\Http\Controllers\NotarialEntryController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\TransactionRemarkController;
use App\Http\Controllers\UserController;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    require __DIR__.'/auth.php';
});

// Document management (protected by signed URLs for preview/download)
Route::get('documents/{document}/stream', [DocumentController::class, 'stream'])
    ->name('documents.stream')
    ->middleware(['signed', 'throttle:public-documents']);

Route::middleware(['auth:sanctum', 'throttle:api-general'])->group(function () {

    // Current user
    Route::get('/user', function (Request $request) {
        return new UserResource($request->user());
    });

    // Self-service profile update (any authenticated user)
    Route::put('/user/profile', [ProfileController::class, 'update']);

    // Import/Export transactions (encoder-accessible)
    Route::get('tracking/{referenceId}', [TransactionController::class, 'showTracking']);
    Route::get('import-transactions/stats', [ImportTransactionController::class, 'stats']);
    Route::get('export-transactions/stats', [ExportTransactionController::class, 'stats']);
    Route::patch('import-transactions/{import_transaction}/cancel', [ImportTransactionController::class, 'cancel']);
    Route::patch('export-transactions/{export_transaction}/cancel', [ExportTransactionController::class, 'cancel']);
    Route::apiResource('import-transactions', ImportTransactionController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::apiResource('export-transactions', ExportTransactionController::class)->only(['index', 'store', 'update', 'destroy']);

    // Clients (read for all, write for admin)
    Route::get('/clients', [ClientController::class, 'index']);
    Route::get('/countries', [CountryController::class, 'index']);

    // Document management
    Route::get('documents/transactions', [DocumentController::class, 'transactions'])
        ->middleware('throttle:api-search');
    Route::apiResource('documents', DocumentController::class)->except(['update']);
    Route::get('documents/{document}/download', [DocumentController::class, 'download'])
        ->middleware('throttle:api-documents');
    Route::get('documents/{document}/preview', [DocumentController::class, 'preview'])
        ->middleware('throttle:api-documents');

    // Archive uploads (legacy)
    Route::prefix('archives')->group(function () {
        Route::get('/', [ArchiveController::class, 'index']);
        Route::post('import', [ArchiveController::class, 'storeImport'])->middleware('throttle:archive-uploads');
        Route::post('export', [ArchiveController::class, 'storeExport'])->middleware('throttle:archive-uploads');
    });

    // Notarial (Law Firm) module
    Route::prefix('notarial')->group(function () {
        Route::apiResource('books', NotarialBookController::class);
        Route::get('books/{book}/report', [NotarialBookController::class, 'report']);
        Route::apiResource('books.entries', NotarialEntryController::class);
    });

    // Admin-only routes — moderate throttle (120 req/min)
    Route::middleware('throttle:api-admin')->group(function () {

        // User management
        Route::apiResource('users', UserController::class);
        Route::post('users/{user}/deactivate', [UserController::class, 'deactivate']);
        Route::post('users/{user}/activate', [UserController::class, 'activate']);

        // Client management (write operations)
        Route::apiResource('clients', ClientController::class)->except(['index']);
        Route::post('clients/{client}/toggle-active', [ClientController::class, 'toggleActive']);
        Route::get('clients/{client}/transactions', [ClientController::class, 'transactions'])
            ->middleware('throttle:api-search');

        // Audit logs (read-only, admin)
        Route::get('audit-logs/actions', [AuditLogController::class, 'actions'])
            ->middleware('throttle:api-search');
        Route::get('audit-logs', [AuditLogController::class, 'index'])
            ->middleware('throttle:api-search');

        // Reports (admin)
        Route::get('reports/monthly', [ReportController::class, 'monthly'])
            ->middleware('throttle:api-search');
        Route::get('reports/clients', [ReportController::class, 'clients'])
            ->middleware('throttle:api-search');
        Route::get('reports/turnaround', [ReportController::class, 'turnaround'])
            ->middleware('throttle:api-search');

        // Admin dashboard
        Route::get('admin/dashboard', [AdminDashboardController::class, 'show'])
            ->middleware('throttle:api-search');

        // Transaction oversight (admin)
        Route::get('transactions', [TransactionController::class, 'index'])
            ->middleware('throttle:api-search');
        Route::get('transactions/encoders', [TransactionController::class, 'encoders'])
            ->middleware('throttle:api-search');
        Route::patch('transactions/import/{importTransaction}/reassign', [TransactionController::class, 'reassignImport']);
        Route::patch('transactions/export/{exportTransaction}/reassign', [TransactionController::class, 'reassignExport']);
        Route::patch('transactions/import/{importTransaction}/status', [TransactionController::class, 'overrideImportStatus']);
        Route::patch('transactions/export/{exportTransaction}/status', [TransactionController::class, 'overrideExportStatus']);

        // Transaction remarks (admin creates; listing/resolving also works for encoders)
        Route::get('transactions/{type}/{id}/remarks', [TransactionRemarkController::class, 'index']);
        Route::post('transactions/{type}/{id}/remarks', [TransactionRemarkController::class, 'store']);
        Route::patch('remarks/{remark}/resolve', [TransactionRemarkController::class, 'resolve']);

        // Admin document review
        Route::prefix('admin/document-review')->group(function () {
            Route::get('/', [AdminDocumentReviewController::class, 'index'])
                ->middleware('throttle:api-search');
            Route::get('stats', [AdminDocumentReviewController::class, 'stats'])
                ->middleware('throttle:api-search');
            Route::post('{type}/{id}/archive', [AdminDocumentReviewController::class, 'archive']);
            Route::get('{type}/{id}', [AdminDocumentReviewController::class, 'show'])
                ->middleware('throttle:api-search');
        });
    });
});
