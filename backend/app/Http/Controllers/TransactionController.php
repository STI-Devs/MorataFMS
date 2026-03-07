<?php

namespace App\Http\Controllers;

use App\Http\Requests\AssignTransactionRequest;
use App\Http\Requests\OverrideStatusRequest;
use App\Models\AuditLog;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TransactionController extends Controller
{
    /**
     * GET /api/transactions
     * Combined list of imports + exports for admin oversight.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $search = $request->query('search');
        $status = $request->query('status');
        $type = $request->query('type');

        // Imports
        $importQuery = ImportTransaction::with(['importer:id,name', 'assignedUser:id,name'])
            ->where('is_archive', false);

        if ($search) {
            $importQuery->where(function ($q) use ($search) {
                $q->where('customs_ref_no', 'like', "%{$search}%")
                    ->orWhere('bl_no', 'like', "%{$search}%")
                    ->orWhereHas('importer', fn($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('assignedUser', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }
        if ($status && $status !== 'all') {
            $importQuery->where('status', $status);
        }

        // Exports
        $exportQuery = ExportTransaction::with(['shipper:id,name', 'assignedUser:id,name', 'destinationCountry:id,name'])
            ->where('is_archive', false);

        if ($search) {
            $exportQuery->where(function ($q) use ($search) {
                $q->where('bl_no', 'like', "%{$search}%")
                    ->orWhere('vessel', 'like', "%{$search}%")
                    ->orWhereHas('shipper', fn($q) => $q->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('assignedUser', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }
        if ($status && $status !== 'all') {
            $exportQuery->where('status', $status);
        }

        $importsCount = ($type === 'export') ? 0 : (clone $importQuery)->count();
        $exportsCount = ($type === 'import') ? 0 : (clone $exportQuery)->count();

        $imports = ($type === 'export') ? collect() : $importQuery->orderBy('created_at', 'desc')->get();
        $exports = ($type === 'import') ? collect() : $exportQuery->orderBy('created_at', 'desc')->get();

        $data = collect();

        foreach ($imports as $t) {
            $data->push([
                'id' => $t->id,
                'type' => 'import',
                'reference_no' => $t->customs_ref_no,
                'bl_no' => $t->bl_no,
                'client' => $t->importer?->name,
                'client_id' => $t->importer_id,
                'date' => $t->arrival_date?->toDateString(),
                'status' => $t->status,
                'selective_color' => $t->selective_color,
                'assigned_to' => $t->assignedUser?->name,
                'assigned_user_id' => $t->assigned_user_id,
                'created_at' => $t->created_at?->toISOString(),
            ]);
        }

        foreach ($exports as $t) {
            $data->push([
                'id' => $t->id,
                'type' => 'export',
                'reference_no' => null,
                'bl_no' => $t->bl_no,
                'client' => $t->shipper?->name,
                'client_id' => $t->shipper_id,
                'vessel' => $t->vessel,
                'destination' => $t->destinationCountry?->name,
                'date' => $t->created_at?->toDateString(),
                'status' => $t->status,
                'selective_color' => null,
                'assigned_to' => $t->assignedUser?->name,
                'assigned_user_id' => $t->assigned_user_id,
                'created_at' => $t->created_at?->toISOString(),
            ]);
        }

        $sorted = $data->sortByDesc('created_at')->values();

        return response()->json([
            'data' => $sorted,
            'total' => $importsCount + $exportsCount,
            'imports_count' => $importsCount,
            'exports_count' => $exportsCount,
        ]);
    }

    /**
     * GET /api/transactions/encoders
     */
    public function encoders(Request $request): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $users = User::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        return response()->json(['data' => $users]);
    }

    /**
     * PATCH /api/transactions/import/{id}/reassign
     */
    public function reassignImport(AssignTransactionRequest $request, string $id): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validated();

        $transaction = ImportTransaction::findOrFail($id);
        $oldEncoder = $transaction->assignedUser?->name ?? 'None';

        $transaction->assigned_user_id = $validated['assigned_user_id'];
        $transaction->save();
        $transaction->load('assignedUser:id,name');

        $newEncoder = $transaction->assignedUser?->name ?? 'Unknown';
        $actor = Auth::user();

        AuditLog::record(
            action: 'encoder_reassigned',
            description: "{$actor->name} reassigned import #{$id} (BL: {$transaction->bl_no}) from {$oldEncoder} to {$newEncoder}.",
            userId: $actor->id,
            subjectType: 'import',
            subjectId: (int) $id,
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => 'Encoder reassigned successfully.',
            'assigned_to' => $transaction->assignedUser?->name,
            'assigned_user_id' => $transaction->assigned_user_id,
        ]);
    }

    /**
     * PATCH /api/transactions/export/{id}/reassign
     */
    public function reassignExport(AssignTransactionRequest $request, string $id): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validated();

        $transaction = ExportTransaction::findOrFail($id);
        $oldEncoder = $transaction->assignedUser?->name ?? 'None';

        $transaction->assigned_user_id = $validated['assigned_user_id'];
        $transaction->save();
        $transaction->load('assignedUser:id,name');

        $newEncoder = $transaction->assignedUser?->name ?? 'Unknown';
        $actor = Auth::user();

        AuditLog::record(
            action: 'encoder_reassigned',
            description: "{$actor->name} reassigned export #{$id} (BL: {$transaction->bl_no}) from {$oldEncoder} to {$newEncoder}.",
            userId: $actor->id,
            subjectType: 'export',
            subjectId: (int) $id,
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => 'Encoder reassigned successfully.',
            'assigned_to' => $transaction->assignedUser?->name,
            'assigned_user_id' => $transaction->assigned_user_id,
        ]);
    }

    /**
     * PATCH /api/transactions/import/{id}/status
     */
    public function overrideImportStatus(OverrideStatusRequest $request, string $id): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validated();

        $transaction = ImportTransaction::findOrFail($id);
        $oldStatus = $transaction->status;
        $transaction->status = $validated['status'];
        $transaction->save();

        $actor = Auth::user();
        AuditLog::record(
            action: 'status_changed',
            description: "{$actor->name} changed import #{$id} (BL: {$transaction->bl_no}) status from {$oldStatus} to {$validated['status']}.",
            userId: $actor->id,
            subjectType: 'import',
            subjectId: (int) $id,
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => 'Status updated successfully.',
            'status' => $transaction->status,
        ]);
    }

    /**
     * PATCH /api/transactions/export/{id}/status
     */
    public function overrideExportStatus(OverrideStatusRequest $request, string $id): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validated();

        $transaction = ExportTransaction::findOrFail($id);
        $oldStatus = $transaction->status;
        $transaction->status = $validated['status'];
        $transaction->save();

        $actor = Auth::user();
        AuditLog::record(
            action: 'status_changed',
            description: "{$actor->name} changed export #{$id} (BL: {$transaction->bl_no}) status from {$oldStatus} to {$validated['status']}.",
            userId: $actor->id,
            subjectType: 'export',
            subjectId: (int) $id,
            ipAddress: $request->ip()
        );

        return response()->json([
            'message' => 'Status updated successfully.',
            'status' => $transaction->status,
        ]);
    }
}
