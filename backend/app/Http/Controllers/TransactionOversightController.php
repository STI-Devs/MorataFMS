<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssignTransactionRequest;
use App\Http\Requests\OverrideStatusRequest;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionOversightController extends Controller
{
    /**
     * GET /api/transactions
     * Combined paginated list of imports + exports for admin oversight.
     */
    public function index(Request $request): JsonResponse
    {
        // Only admins can view the oversight dashboard
        $user = $request->user();
        if (! $user->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $search = $request->query('search');
        $status = $request->query('status');
        $type = $request->query('type'); // 'import' | 'export' | null

        // Build import query
        $importQuery = ImportTransaction::with(['importer', 'assignedUser'])
            ->where('is_archive', false)
            ->select([
                'id',
                'customs_ref_no',
                'bl_no',
                'importer_id',
                'status',
                'selective_color',
                'assigned_user_id',
                'arrival_date',
                'created_at',
            ]);

        if ($search) {
            $importQuery->where(function ($q) use ($search) {
                $q->where('customs_ref_no', 'like', "%{$search}%")
                    ->orWhere('bl_no', 'like', "%{$search}%")
                    ->orWhereHas('importer', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('assignedUser', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if ($status && $status !== 'all') {
            $importQuery->where('status', $status);
        }

        // Build export query
        $exportQuery = ExportTransaction::with(['shipper', 'assignedUser'])
            ->where('is_archive', false)
            ->select([
                'id',
                'bl_no',
                'shipper_id',
                'vessel',
                'destination_country_id',
                'status',
                'assigned_user_id',
                'export_date',
                'created_at',
            ]);

        if ($search) {
            $exportQuery->where(function ($q) use ($search) {
                $q->where('bl_no', 'like', "%{$search}%")
                    ->orWhere('vessel', 'like', "%{$search}%")
                    ->orWhereHas('shipper', fn ($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('assignedUser', fn ($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if ($status && $status !== 'all') {
            $exportQuery->where('status', $status);
        }

        // Get counts before type filtering
        $importsCount = ($type === 'export') ? 0 : (clone $importQuery)->count();
        $exportsCount = ($type === 'import') ? 0 : (clone $exportQuery)->count();

        // Fetch and normalize
        $imports = ($type === 'export') ? collect() : $importQuery->orderBy('created_at', 'desc')->get();
        $exports = ($type === 'import') ? collect() : $exportQuery->orderBy('created_at', 'desc')->get();

        $normalized = collect();

        foreach ($imports as $t) {
            $normalized->push([
                'id' => $t->id,
                'type' => 'import',
                'reference_no' => $t->customs_ref_no,
                'bl_no' => $t->bl_no,
                'client' => $t->importer?->name,
                'client_id' => $t->importer_id,
                'date' => $t->arrival_date?->format('Y-m-d'),
                'status' => $t->status,
                'selective_color' => $t->selective_color,
                'assigned_to' => $t->assignedUser?->name,
                'assigned_user_id' => $t->assigned_user_id,
                'created_at' => $t->created_at?->toISOString(),
            ]);
        }

        foreach ($exports as $t) {
            $normalized->push([
                'id' => $t->id,
                'type' => 'export',
                'reference_no' => null,
                'bl_no' => $t->bl_no,
                'client' => $t->shipper?->name,
                'client_id' => $t->shipper_id,
                'vessel' => $t->vessel,
                'date' => $t->export_date?->format('Y-m-d'),
                'status' => $t->status,
                'selective_color' => null,
                'assigned_to' => $t->assignedUser?->name,
                'assigned_user_id' => $t->assigned_user_id,
                'created_at' => $t->created_at?->toISOString(),
            ]);
        }

        // Sort combined by created_at desc
        $sorted = $normalized->sortByDesc('created_at')->values();

        return response()->json([
            'data' => $sorted,
            'total' => $importsCount + $exportsCount,
            'imports_count' => $importsCount,
            'exports_count' => $exportsCount,
        ]);
    }

    /**
     * GET /api/transactions/encoders
     * List all users eligible for transaction assignment.
     */
    public function encoders(Request $request): JsonResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $users = User::select(['id', 'name', 'email', 'role'])
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $users]);
    }

    /**
     * PATCH /api/transactions/imports/{import}/assign
     */
    public function assignImport(AssignTransactionRequest $request, ImportTransaction $import): JsonResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $import->assigned_user_id = $request->validated()['assigned_user_id'];
        $import->save();

        $import->load('assignedUser');

        return response()->json([
            'message' => 'Encoder reassigned successfully.',
            'assigned_to' => $import->assignedUser?->name,
            'assigned_user_id' => $import->assigned_user_id,
        ]);
    }

    /**
     * PATCH /api/transactions/exports/{export}/assign
     */
    public function assignExport(AssignTransactionRequest $request, ExportTransaction $export): JsonResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $export->assigned_user_id = $request->validated()['assigned_user_id'];
        $export->save();

        $export->load('assignedUser');

        return response()->json([
            'message' => 'Encoder reassigned successfully.',
            'assigned_to' => $export->assignedUser?->name,
            'assigned_user_id' => $export->assigned_user_id,
        ]);
    }

    /**
     * PATCH /api/transactions/imports/{import}/status
     */
    public function overrideImportStatus(OverrideStatusRequest $request, ImportTransaction $import): JsonResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $import->status = $request->validated()['status'];
        $import->save();

        return response()->json([
            'message' => 'Status updated successfully.',
            'status' => $import->status,
        ]);
    }

    /**
     * PATCH /api/transactions/exports/{export}/status
     */
    public function overrideExportStatus(OverrideStatusRequest $request, ExportTransaction $export): JsonResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $export->status = $request->validated()['status'];
        $export->save();

        return response()->json([
            'message' => 'Status updated successfully.',
            'status' => $export->status,
        ]);
    }
}
