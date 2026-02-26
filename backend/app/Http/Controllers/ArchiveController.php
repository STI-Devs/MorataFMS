<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreArchiveExportRequest;
use App\Http\Requests\StoreArchiveImportRequest;
use App\Http\Resources\ExportTransactionResource;
use App\Http\Resources\ImportTransactionResource;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Illuminate\Http\JsonResponse;

/**
 * Handles legacy archive uploads and listing.
 *
 * This controller is intentionally separate from ImportTransactionController
 * and ExportTransactionController so archive-specific validation (e.g. past-only
 * file_date) is enforced at the API level, not just the frontend.
 *
 * Routes:
 *   GET  /api/archives         → list archive years + documents
 *   POST /api/archives/import  → create archive import
 *   POST /api/archives/export  → create archive export
 */
class ArchiveController extends Controller
{
    /**
     * GET /api/archives
     * List all archived transactions grouped by year.
     *
     * An "archive" transaction is any completed import/export whose date
     * falls in a previous year (not the current year). Documents are loaded
     * via the polymorphic relationship from the DB — no S3 listing needed.
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Document::class);

        // Query on is_archive — explicit, unambiguous, indexed.
        // Year comes from the actual historical date fields, not created_at.
        $imports = ImportTransaction::where('is_archive', true)
            ->with(['documents.uploadedBy', 'importer'])
            ->get()
            ->map(fn($t) => [
                'transaction_type' => 'import',
                'year' => $t->arrival_date?->year ?? $t->created_at->year,
                'month' => $t->arrival_date?->month ?? $t->created_at->month,
                'bl_no' => $t->bl_no,
                'client' => $t->importer?->name ?? 'Unknown',
                'documents' => $t->documents->map(fn($d) => [
                    'id' => $d->id,
                    'type' => 'import',
                    'bl_no' => $t->bl_no,
                    'month' => $t->arrival_date?->month ?? $t->created_at->month,
                    'client' => $t->importer?->name ?? 'Unknown',
                    'transaction_date' => ($t->arrival_date ?? $t->created_at)->toDateString(),
                    'stage' => $d->type,
                    'filename' => $d->filename,
                    'formatted_size' => $d->formatted_size,
                    'uploaded_at' => $d->created_at?->toIso8601String(),
                    'uploader' => $d->uploadedBy ? [
                        'id' => $d->uploadedBy->id,
                        'name' => $d->uploadedBy->name,
                    ] : null,
                ]),
            ]);

        $exports = ExportTransaction::where('is_archive', true)
            ->with(['documents.uploadedBy', 'shipper'])
            ->get()
            ->map(fn($t) => [
                'transaction_type' => 'export',
                // export_date holds the historical shipment date (set from file_date).
                'year' => $t->export_date?->year ?? $t->created_at->year,
                'month' => $t->export_date?->month ?? $t->created_at->month,
                'bl_no' => $t->bl_no,
                'client' => $t->shipper?->name ?? 'Unknown',
                'documents' => $t->documents->map(fn($d) => [
                    'id' => $d->id,
                    'type' => 'export',
                    'bl_no' => $t->bl_no,
                    'month' => $t->export_date?->month ?? $t->created_at->month,
                    'client' => $t->shipper?->name ?? 'Unknown',
                    'transaction_date' => ($t->export_date ?? $t->created_at)->toDateString(),
                    'stage' => $d->type,
                    'filename' => $d->filename,
                    'formatted_size' => $d->formatted_size,
                    'uploaded_at' => $d->created_at?->toIso8601String(),
                    'uploader' => $d->uploadedBy ? [
                        'id' => $d->uploadedBy->id,
                        'name' => $d->uploadedBy->name,
                    ] : null,
                ]),
            ]);

        // Merge, group by year descending, flatten documents
        $grouped = $imports->merge($exports)
            ->groupBy('year')
            ->sortKeysDesc()
            ->map(fn($items, $year) => [
                'year' => (int) $year,
                'imports' => $items->where('transaction_type', 'import')->count(),
                'exports' => $items->where('transaction_type', 'export')->count(),
                'documents' => $items->pluck('documents')->flatten(1)->values(),
            ])
            ->values();

        return response()->json(['data' => $grouped]);
    }

    /**
     * POST /api/archives/import
     * Create a legacy archive import transaction.
     * The file_date must be today or in the past (before_or_equal:today).
     */
    public function storeImport(StoreArchiveImportRequest $request)
    {
        $this->authorize('create', ImportTransaction::class);

        $validated = $request->validated();

        $transaction = new ImportTransaction();
        $transaction->customs_ref_no = $validated['customs_ref_no']
            ?? 'ARCH-' . $validated['file_date'] . '-' . strtoupper(substr(uniqid(), -6));
        $transaction->bl_no = $validated['bl_no'];
        $transaction->selective_color = $validated['selective_color'];
        $transaction->importer_id = $validated['importer_id'];
        $transaction->origin_country_id = $validated['origin_country_id'] ?? null;
        $transaction->arrival_date = $validated['file_date']; // map archive file_date → arrival_date
        $transaction->notes = $validated['notes'] ?? null;
        $transaction->is_archive = true;       // explicit archive marker
        $transaction->assigned_user_id = $request->user()->id;
        $transaction->status = 'completed';
        $transaction->save();

        $transaction->load(['importer', 'originCountry', 'stages', 'assignedUser']);

        return (new ImportTransactionResource($transaction))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * POST /api/archives/export
     * Create a legacy archive export transaction.
     * The file_date must be today or in the past (before_or_equal:today).
     */
    public function storeExport(StoreArchiveExportRequest $request)
    {
        $this->authorize('create', ExportTransaction::class);

        $validated = $request->validated();

        $transaction = new ExportTransaction();
        $transaction->bl_no = $validated['bl_no'];
        $transaction->vessel = $validated['vessel'] ?? 'N/A';
        $transaction->shipper_id = $validated['shipper_id'];
        $transaction->destination_country_id = $validated['destination_country_id'];
        $transaction->notes = $validated['notes'] ?? null;
        $transaction->export_date = $validated['file_date']; // historical shipment date
        $transaction->is_archive = true;                     // explicit archive marker
        $transaction->assigned_user_id = $request->user()->id;
        $transaction->status = 'completed';
        $transaction->save();

        $transaction->load(['shipper', 'destinationCountry', 'stages', 'assignedUser']);

        return (new ExportTransactionResource($transaction))
            ->response()
            ->setStatusCode(201);
    }
}

