<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Queries\Dashboard\AdminDashboardShowQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminDashboardController extends Controller
{
    public function __construct(
        private AdminDashboardShowQuery $adminDashboardShowQuery,
    ) {}

    /**
     * GET /api/admin/dashboard
     */
    public function show(Request $request): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        return response()->json($this->adminDashboardShowQuery->handle());
    }
}
