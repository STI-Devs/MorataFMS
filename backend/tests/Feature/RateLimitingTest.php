<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

test('sensitive routes use the named rate limiters', function () {
    $loginRoute = Route::getRoutes()->match(Request::create('/api/auth/login', 'POST'));
    $currentUserRoute = Route::getRoutes()->match(Request::create('/api/user', 'GET'));
    $adminDashboardRoute = Route::getRoutes()->match(Request::create('/api/admin/dashboard', 'GET'));

    expect($loginRoute->gatherMiddleware())->toContain('throttle:auth-login');
    expect($currentUserRoute->gatherMiddleware())->toContain('throttle:api-general');
    expect($adminDashboardRoute->gatherMiddleware())->toContain('throttle:api-admin', 'throttle:api-search');
});
