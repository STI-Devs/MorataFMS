<?php

namespace App\Http\Controllers\Transactions;

use App\Http\Controllers\Controller;
use App\Http\Requests\Transactions\OverrideStatusRequest;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Orchestrators\Transactions\TransactionOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function __construct(
        private TransactionOrchestrator $transactions,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        return response()->json($this->transactions->index($request));
    }

    public function showTracking(Request $request, string $referenceId): JsonResponse
    {
        $this->authorize('viewAny', ImportTransaction::class);

        return response()->json($this->transactions->showTracking($request, $referenceId));
    }

    public function overrideImportStatus(OverrideStatusRequest $request, ImportTransaction $importTransaction): JsonResponse
    {
        $this->authorize('transactions.overrideStatus');

        $validated = $request->validated();
        $this->transactions->overrideStatus(
            $importTransaction,
            $request->user(),
            (string) $validated['status'],
            $request->ip(),
        );

        return response()->json([
            'message' => 'Status updated successfully.',
            'status' => $importTransaction->status,
        ]);
    }

    public function overrideExportStatus(OverrideStatusRequest $request, ExportTransaction $exportTransaction): JsonResponse
    {
        $this->authorize('transactions.overrideStatus');

        $validated = $request->validated();
        $this->transactions->overrideStatus(
            $exportTransaction,
            $request->user(),
            (string) $validated['status'],
            $request->ip(),
        );

        return response()->json([
            'message' => 'Status updated successfully.',
            'status' => $exportTransaction->status,
        ]);
    }
}
