<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Queries\Dashboard\EncoderDashboardShowQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EncoderDashboardController extends Controller
{
    public function __construct(
        private EncoderDashboardShowQuery $encoderDashboardShowQuery,
    ) {}

    /**
     * GET /api/encoder/dashboard
     */
    public function show(Request $request): JsonResponse
    {
        abort_unless($request->user()?->role === UserRole::Encoder, 403);

        return response()->json($this->encoderDashboardShowQuery->handle($request->user()));
    }
}
