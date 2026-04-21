<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

test('sensitive routes use the named rate limiters', function () {
    $loginRoute = Route::getRoutes()->match(Request::create('/api/auth/login', 'POST'));
    $currentUserRoute = Route::getRoutes()->match(Request::create('/api/user', 'GET'));
    $adminDashboardRoute = Route::getRoutes()->match(Request::create('/api/admin/dashboard', 'GET'));
    $documentStreamRoute = Route::getRoutes()->match(Request::create('/api/documents/1/stream', 'GET'));
    $legacyBatchCreateRoute = Route::getRoutes()->match(Request::create('/api/legacy-batches', 'POST'));
    $legacyBatchSignRoute = Route::getRoutes()->match(Request::create('/api/legacy-batches/test-batch/files/sign', 'POST'));

    expect($loginRoute->gatherMiddleware())->toContain('throttle:auth-login');
    expect($currentUserRoute->gatherMiddleware())->toContain('throttle:api-general');
    expect($adminDashboardRoute->gatherMiddleware())->toContain('throttle:api-admin', 'throttle:api-search');
    expect($documentStreamRoute->gatherMiddleware())->toContain('auth:sanctum', 'active-session', 'throttle:api-documents');
    expect($legacyBatchCreateRoute->gatherMiddleware())->toContain('throttle:legacy-batch-uploads');
    expect($legacyBatchSignRoute->gatherMiddleware())->toContain('throttle:legacy-batch-uploads');
});
