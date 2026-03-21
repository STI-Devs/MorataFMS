<?php

namespace App\Http\Controllers;

use App\Actions\Documents\StoreTransactionDocument;
use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Support\Transactions\ExportStatusWorkflow;
use App\Support\Transactions\ImportStatusWorkflow;
use Illuminate\Filesystem\AwsS3V3Adapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    public function __construct(private StoreTransactionDocument $storeTransactionDocument) {}

    /**
     * GET /api/documents
     * List all documents, optionally filtered by transaction.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Document::class);

        $query = Document::with('uploadedBy');

        // Filter by transaction type and ID
        if ($request->has('documentable_type') && $request->has('documentable_id')) {
            $query->where('documentable_type', $request->input('documentable_type'))
                ->where('documentable_id', $request->input('documentable_id'));
        }

        $documents = $query->orderBy('created_at', 'desc')->get();

        return DocumentResource::collection($documents);
    }

    /**
     * GET /api/documents/transactions
     * Combined paginated list of finalized import/export transactions for the documents page.
     */
    public function transactions(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Document::class);

        $search = trim((string) $request->query('search', ''));
        $type = $request->query('type');
        $perPage = min(max((int) $request->input('per_page', 10), 1), 50);
        $importFinalizedStatuses = [ImportStatusWorkflow::completed(), ImportStatus::Cancelled->value];
        $exportFinalizedStatuses = [ExportStatusWorkflow::completed(), ExportStatus::Cancelled->value];

        $importBaseQuery = ImportTransaction::query()
            ->selectRaw("id, 'import' as type, created_at")
            ->whereIn('status', $importFinalizedStatuses);

        if ($search !== '') {
            $importBaseQuery->where(function ($query) use ($search) {
                $query->where('customs_ref_no', 'like', "%{$search}%")
                    ->orWhere('bl_no', 'like', "%{$search}%")
                    ->orWhereHas('importer', function ($importerQuery) use ($search) {
                        $importerQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $exportBaseQuery = ExportTransaction::query()
            ->selectRaw("id, 'export' as type, created_at")
            ->whereIn('status', $exportFinalizedStatuses);

        if ($search !== '') {
            $exportBaseQuery->where(function ($query) use ($search) {
                $query->where('bl_no', 'like', "%{$search}%")
                    ->orWhere('vessel', 'like', "%{$search}%")
                    ->orWhereHas('shipper', function ($shipperQuery) use ($search) {
                        $shipperQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $importsCount = $type === 'export' ? 0 : (clone $importBaseQuery)->count();
        $exportsCount = $type === 'import' ? 0 : (clone $exportBaseQuery)->count();
        $cancelledImportsCount = $type === 'export'
            ? 0
            : (clone $importBaseQuery)->where('status', ImportStatus::Cancelled->value)->count();
        $cancelledExportsCount = $type === 'import'
            ? 0
            : (clone $exportBaseQuery)->where('status', ExportStatus::Cancelled->value)->count();

        $unionQuery = match ($type) {
            'import' => $importBaseQuery->toBase(),
            'export' => $exportBaseQuery->toBase(),
            default => $importBaseQuery->toBase()->unionAll($exportBaseQuery->toBase()),
        };

        $paginator = DB::query()
            ->fromSub($unionQuery, 'document_transactions')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        $items = collect($paginator->items());
        $importIds = $items->where('type', 'import')->pluck('id');
        $exportIds = $items->where('type', 'export')->pluck('id');

        $imports = ImportTransaction::query()
            ->with(['importer:id,name'])
            ->withCount('documents')
            ->whereIn('id', $importIds)
            ->get()
            ->keyBy('id');

        $exports = ExportTransaction::query()
            ->with(['shipper:id,name', 'destinationCountry:id,name'])
            ->withCount('documents')
            ->whereIn('id', $exportIds)
            ->get()
            ->keyBy('id');

        $rows = $items->map(function ($item) use ($imports, $exports) {
            if ($item->type === 'import') {
                $transaction = $imports->get($item->id);

                if (! $transaction) {
                    return null;
                }

                return [
                    'id' => $transaction->id,
                    'type' => 'import',
                    'ref' => $transaction->customs_ref_no,
                    'bl_no' => $transaction->bl_no ?? '—',
                    'client' => $transaction->importer?->name ?? '—',
                    'date' => $transaction->arrival_date?->format('Y-m-d') ?? '—',
                    'date_label' => 'Arrival',
                    'port' => '—',
                    'vessel' => '—',
                    'status' => $transaction->status,
                    'documents_count' => $transaction->documents_count ?? 0,
                ];
            }

            $transaction = $exports->get($item->id);

            if (! $transaction) {
                return null;
            }

            return [
                'id' => $transaction->id,
                'type' => 'export',
                'ref' => 'EXP-'.str_pad((string) $transaction->id, 4, '0', STR_PAD_LEFT),
                'bl_no' => $transaction->bl_no ?? '—',
                'client' => $transaction->shipper?->name ?? '—',
                'date' => $transaction->created_at?->toDateString() ?? '—',
                'date_label' => 'Export',
                'port' => $transaction->destinationCountry?->name ?? '—',
                'vessel' => $transaction->vessel ?? '—',
                'status' => $transaction->status,
                'documents_count' => $transaction->documents_count ?? 0,
            ];
        })->filter()->values();

        return response()->json([
            'data' => $rows,
            'counts' => [
                'completed' => ($importsCount + $exportsCount) - ($cancelledImportsCount + $cancelledExportsCount),
                'imports' => $importsCount,
                'exports' => $exportsCount,
                'cancelled' => $cancelledImportsCount + $cancelledExportsCount,
            ],
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * POST /api/documents
     * Upload a file to S3 and create a document record.
     */
    public function store(StoreDocumentRequest $request)
    {
        $this->authorize('create', Document::class);

        $validated = $request->validated();
        $transaction = $this->resolveDocumentable($validated['documentable_type'], $validated['documentable_id']);
        $document = $this->storeTransactionDocument->handle(
            $transaction,
            $request->file('file'),
            $validated['type'],
            $request->user()->id,
        );

        // Recalculate parent transaction's stage statuses based on uploaded docs
        $parent = $document->documentable;
        if ($parent && method_exists($parent, 'recalculateStatus')) {
            $parent->recalculateStatus();
        }

        return (new DocumentResource($document))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * GET /api/documents/{document}
     * Get document metadata.
     */
    public function show(Document $document)
    {
        $this->authorize('view', $document);

        $document->load('uploadedBy');

        return new DocumentResource($document);
    }

    /**
     * GET /api/documents/{document}/preview
     *
     * Returns a viewer-ready representation of the stored file:
     * - S3 / cloud disk  → JSON { url } with a 60-second pre-signed URL.
     *   The frontend sends it to <iframe> / <img> / Google Docs Viewer.
     * - Local disk       → streams the file inline with the correct MIME type
     *   so the browser renders it natively.
     *
     * Uses the same disk as store() / download() / destroy() so the file is
     * guaranteed to exist.
     */
    public function preview(Document $document)
    {
        $this->authorize('view', $document);

        $diskName = self::storageDisk();

        if ($diskName === 's3') {
            /** @var AwsS3V3Adapter $disk */
            $disk = Storage::disk($diskName);
            $url = $disk->temporaryUrl($document->path, now()->addMinutes(5));
        } else {
            // Local disk — generate a secure signed route that acts like a pre-signed URL
            $url = URL::temporarySignedRoute(
                'documents.stream',
                now()->addMinutes(5),
                ['document' => $document->id]
            );
        }

        return response()->json(['url' => $url]);
    }

    /**
     * GET /api/documents/{document}/stream
     *
     * Securely streams a file from the local disk when accessed via a signed route.
     * This mimics S3's pre-signed URL behavior natively.
     */
    public function stream(Document $document)
    {
        // Authorization is handled implicitly by the 'signed' middleware route protection.

        $disk = Storage::disk(self::storageDisk());

        if (! $disk->exists($document->path)) {
            abort(404, 'File not found on storage.');
        }

        $mimeType = $disk->mimeType($document->path) ?: 'application/octet-stream';
        $stream = $disk->readStream($document->path);

        return response()->stream(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="'.addslashes($document->filename).'"',
            'Cache-Control' => 'no-store',
        ]);
    }

    // ─── Shared helpers ────────────────────────────────────────────────────────

    /**
     * Single source of truth for which storage disk all document operations use.
     * Override by setting APP_STORAGE_DISK in .env (default: 's3').
     */
    private static function storageDisk(): string
    {
        return config('filesystems.document_disk', 's3');
    }

    /**
     * GET /api/documents/{document}/download
     * Stream the file from S3 with proper headers.
     */
    public function download(Document $document): StreamedResponse
    {
        $this->authorize('view', $document);

        $disk = Storage::disk(self::storageDisk());

        if (! $disk->exists($document->path)) {
            abort(404, 'File not found on storage.');
        }

        $stream = $disk->readStream($document->path);

        if (! $stream) {
            abort(500, 'Unable to read file stream.');
        }

        return response()->streamDownload(function () use ($stream) {
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, $document->filename);
    }

    /**
     * DELETE /api/documents/{document}
     * Delete the file from S3 and the database record.
     */
    public function destroy(Document $document)
    {
        $this->authorize('delete', $document);

        // Capture parent before deletion (relationship cleared after)
        $parent = $document->documentable;

        // delete() is a no-op if the file doesn't exist — no exists() check needed
        Storage::disk(self::storageDisk())->delete($document->path);

        $document->delete();

        // Recalculate after deletion so status rolls back if needed
        if ($parent && method_exists($parent, 'recalculateStatus')) {
            $parent->recalculateStatus();
        }

        return response()->noContent();
    }

    private function resolveDocumentable(string $documentableType, int $documentableId): ImportTransaction|ExportTransaction
    {
        return match ($documentableType) {
            ImportTransaction::class => ImportTransaction::findOrFail($documentableId),
            ExportTransaction::class => ExportTransaction::findOrFail($documentableId),
        };
    }
}
