<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

test('sensitive routes use the named rate limiters', function () {
    $loginRoute = Route::getRoutes()->match(Request::create('/api/auth/login', 'POST'));
    $currentUserRoute = Route::getRoutes()->match(Request::create('/api/user', 'GET'));
    $adminDashboardRoute = Route::getRoutes()->match(Request::create('/api/admin/dashboard', 'GET'));
    $documentStreamRoute = Route::getRoutes()->match(Request::create('/api/documents/1/stream', 'GET'));
    $legacyBatchCreateRoute = Route::getRoutes()->match(Request::create('/api/legacy-batches', 'POST'));
    $legacyBatchSignRoute = Route::getRoutes()->match(Request::create('/api/legacy-batches/test-batch/files/sign', 'POST'));
    $archiveZipDownloadRoute = Route::getRoutes()->match(Request::create('/api/archive-zip-exports/test-export/download', 'GET'));
    $legacyBatchZipDownloadRoute = Route::getRoutes()->match(Request::create('/api/legacy-batch-zip-exports/test-export/download', 'GET'));

    expect($loginRoute->gatherMiddleware())->toContain('throttle:auth-login');
    expect($currentUserRoute->gatherMiddleware())->toContain('throttle:api-general');
    expect($adminDashboardRoute->gatherMiddleware())->toContain('throttle:api-admin', 'throttle:api-search');
    expect($documentStreamRoute->gatherMiddleware())->toContain('auth:sanctum', 'active-session', 'throttle:api-documents');
    expect($legacyBatchCreateRoute->gatherMiddleware())->toContain('throttle:legacy-batch-uploads');
    expect($legacyBatchSignRoute->gatherMiddleware())->toContain('throttle:legacy-batch-uploads');
    expect($archiveZipDownloadRoute->gatherMiddleware())
        ->toContain('throttle:zip-downloads')
        ->not->toContain('throttle:api-documents');
    expect($legacyBatchZipDownloadRoute->gatherMiddleware())
        ->toContain('throttle:zip-downloads')
        ->not->toContain('throttle:api-documents');
});

test('zip download limiter allows fifteen attempts per minute', function () {
    $limiter = RateLimiter::limiter('zip-downloads');

    expect($limiter)->not->toBeNull();

    $limit = $limiter(Request::create('/api/archive-zip-exports/test-export/download', 'GET'));

    expect($limit->maxAttempts)->toBe(15)
        ->and($limit->decaySeconds)->toBe(60)
        ->and($limit->key)->toBe('zip-downloads:127.0.0.1');
});
