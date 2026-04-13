<?php

namespace App\Http\Controllers;

use App\Enums\ArchiveOrigin;
use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Support\Documents\DocumentObjectTagger;
use App\Support\Transactions\TransactionSyncBroadcaster;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AdminDocumentReviewController extends Controller
{
    public function __construct(
        private TransactionSyncBroadcaster $transactionSyncBroadcaster,
        private DocumentObjectTagger $documentObjectTagger,
    ) {}

    /**
     * GET /api/admin/document-review
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        $search = trim((string) $request->query('search', ''));
        $typeFilter = $this->normalizeTypeFilter($request->query('type'));
        $statusFilter = $this->normalizeStatusFilter($request->query('status'));
        $readinessFilter = $this->normalizeReadinessFilter($request->query('readiness'));
        $assignedUserId = $this->normalizeAssignedUserFilter($request->query('assigned_user_id'));
        $perPage = min(max((int) $request->query('per_page', 10), 1), 50);

        $importBaseQuery = $this->buildImportQueueBaseQuery($search, $statusFilter, $readinessFilter, $assignedUserId);
        $exportBaseQuery = $this->buildExportQueueBaseQuery($search, $statusFilter, $readinessFilter, $assignedUserId);

        $unionQuery = match ($typeFilter) {
            'import' => $importBaseQuery->toBase(),
            'export' => $exportBaseQuery->toBase(),
            default => $importBaseQuery->toBase()->unionAll($exportBaseQuery->toBase()),
        };

        $paginator = DB::query()
            ->fromSub($unionQuery, 'admin_document_review_queue')
            ->orderByDesc('finalized_at')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        $items = collect($paginator->items());
        $imports = $this->loadQueueImports($items->where('type', 'import')->pluck('id'));
        $exports = $this->loadQueueExports($items->where('type', 'export')->pluck('id'));

        return response()->json([
            'data' => $this->mapQueueRows($items, $imports, $exports),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * GET /api/admin/document-review/{type}/{id}
     */
    public function show(Request $request, string $type, int $id): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        $transaction = $this->resolveReviewTransaction($type, $id);
        $requiredTypes = $this->requiredTypeKeysFor($type, $transaction);
        $displayStageTypes = $this->displayTypeKeysFor($type);
        $notApplicableStages = $transaction->notApplicableStageKeys();
        $labels = Document::getTypeLabels();
        $documents = $transaction->documents;
        $requiredCompleted = $this->countUploadedRequiredTypes($documents, $requiredTypes);
        $flaggedCount = $transaction->remarks->filter(fn ($remark) => ! $remark->is_resolved)->count();
        $requiredTotal = count($requiredTypes);

        return response()->json([
            'transaction' => $this->mapDetailTransaction($transaction, $type),
            'required_documents' => collect($displayStageTypes)
                ->map(function (string $typeKey) use ($documents, $labels, $notApplicableStages): array {
                    $stageDocuments = $documents
                        ->where('type', $typeKey)
                        ->sortByDesc(fn (Document $file) => $file->created_at?->getTimestamp() ?? 0)
                        ->values();
                    $notApplicable = in_array($typeKey, $notApplicableStages, true);

                    return [
                        'type_key' => $typeKey,
                        'label' => $labels[$typeKey] ?? $typeKey,
                        'uploaded' => $stageDocuments->isNotEmpty(),
                        'not_applicable' => $notApplicable,
                        'files' => $stageDocuments->map(fn (Document $file) => [
                            'id' => $file->id,
                            'filename' => $file->filename,
                            'size' => $file->formatted_size,
                            'uploaded_by' => $file->uploadedBy?->name,
                            'uploaded_at' => $this->formatDateTime($file->created_at),
                        ])->all(),
                    ];
                })
                ->values()
                ->all(),
            'uploaded_documents' => $documents
                ->map(function (Document $document) use ($labels): array {
                    return [
                        'id' => $document->id,
                        'type_key' => $document->type,
                        'label' => $labels[$document->type] ?? $document->type,
                        'filename' => $document->filename,
                        'size' => $document->formatted_size,
                        'uploaded_by' => $document->uploadedBy?->name,
                        'uploaded_at' => $this->formatDateTime($document->created_at),
                    ];
                })
                ->values()
                ->all(),
            'remarks' => $transaction->remarks
                ->map(fn ($remark): array => [
                    'id' => $remark->id,
                    'body' => $remark->message,
                    'author' => $remark->author?->name ?? 'Unknown',
                    'resolved' => (bool) $remark->is_resolved,
                    'created_at' => $this->formatDateTime($remark->created_at),
                ])
                ->values()
                ->all(),
            'summary' => [
                'total_uploaded' => $documents->count(),
                'required_completed' => $requiredCompleted,
                'required_total' => $requiredTotal,
                'missing_count' => max($requiredTotal - $requiredCompleted, 0),
                'flagged_count' => $flaggedCount,
                'archive_ready' => $requiredCompleted === $requiredTotal && $flaggedCount === 0,
                'readiness' => $this->readinessFor($requiredCompleted === $requiredTotal, $flaggedCount > 0),
            ],
        ]);
    }

    /**
     * GET /api/admin/document-review/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        $importTerminalQuery = ImportTransaction::query()
            ->leftJoin('import_stages', 'import_stages.import_transaction_id', '=', 'import_transactions.id')
            ->where('is_archive', false)
            ->whereIn('status', $this->importStatusValues('all'));

        $exportTerminalQuery = ExportTransaction::query()
            ->leftJoin('export_stages', 'export_stages.export_transaction_id', '=', 'export_transactions.id')
            ->where('is_archive', false)
            ->whereIn('status', $this->exportStatusValues('all'));

        $completedCount = ImportTransaction::query()
            ->where('is_archive', false)
            ->where('status', ImportStatus::Completed->value)
            ->count()
            + ExportTransaction::query()
                ->where('is_archive', false)
                ->where('status', ExportStatus::Completed->value)
                ->count();

        $cancelledCount = ImportTransaction::query()
            ->where('is_archive', false)
            ->where('status', ImportStatus::Cancelled->value)
            ->count()
            + ExportTransaction::query()
                ->where('is_archive', false)
                ->where('status', ExportStatus::Cancelled->value)
                ->count();

        $completeImportsCount = $this->countWithAllRequiredDocuments(clone $importTerminalQuery, 'import');
        $completeExportsCount = $this->countWithAllRequiredDocuments(clone $exportTerminalQuery, 'export');

        $missingDocsCount = (clone $importTerminalQuery)->count()
            + (clone $exportTerminalQuery)->count()
            - $completeImportsCount
            - $completeExportsCount;

        $archiveReadyCount = $this->countArchiveReady(clone $importTerminalQuery, 'import')
            + $this->countArchiveReady(clone $exportTerminalQuery, 'export');

        return response()->json([
            'completed_count' => $completedCount,
            'cancelled_count' => $cancelledCount,
            'missing_docs_count' => $missingDocsCount,
            'archive_ready_count' => $archiveReadyCount,
        ]);
    }

    /**
     * POST /api/admin/document-review/{type}/{id}/archive
     */
    public function archive(Request $request, string $type, int $id): JsonResponse
    {
        $this->authorize('transactions.viewOversight');

        $transaction = $this->resolveReviewTransaction($type, $id);
        $requiredTypes = $this->requiredTypeKeysFor($type, $transaction);
        $requiredCompleted = $this->countUploadedRequiredTypes($transaction->documents, $requiredTypes);
        $hasUnresolvedRemarks = $this->hasUnresolvedRemarks($transaction->remarks);

        if ($requiredCompleted !== count($requiredTypes) || $hasUnresolvedRemarks) {
            return response()->json([
                'message' => 'This transaction is not ready for archive.',
            ], 422);
        }

        $transaction->forceFill([
            'is_archive' => true,
            'archived_at' => now(),
            'archived_by' => $request->user()->id,
            'archive_origin' => ArchiveOrigin::ArchivedFromLive,
        ])->save();
        $transaction->load('documents');
        $this->documentObjectTagger->syncTransactionDocuments($transaction);
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $request->user(), 'archived');

        return response()->json([
            'message' => 'Transaction archived successfully.',
            'data' => [
                'id' => $transaction->id,
                'type' => $type,
                'is_archive' => true,
                'archived_at' => $this->formatDateTime($transaction->archived_at),
                'archived_by_id' => $transaction->archived_by,
                'archive_origin' => $transaction->archive_origin?->value,
            ],
        ]);
    }

    private function buildImportQueueBaseQuery(
        string $search,
        string $statusFilter,
        string $readinessFilter,
        ?int $assignedUserId,
    ): Builder {
        $query = ImportTransaction::query()
            ->leftJoin('import_stages', 'import_stages.import_transaction_id', '=', 'import_transactions.id')
            ->selectRaw("
                import_transactions.id,
                'import' as type,
                import_transactions.created_at as created_at,
                COALESCE(import_stages.billing_completed_at, import_transactions.updated_at) as finalized_at
            ")
            ->where('import_transactions.is_archive', false)
            ->whereIn('import_transactions.status', $this->importStatusValues($statusFilter));

        if ($assignedUserId !== null) {
            $query->where('import_transactions.assigned_user_id', $assignedUserId);
        }

        if ($search !== '') {
            $query->where(function (Builder $searchQuery) use ($search) {
                $searchQuery
                    ->where('import_transactions.bl_no', 'like', "%{$search}%")
                    ->orWhere('import_transactions.customs_ref_no', 'like', "%{$search}%")
                    ->orWhereHas('importer', function (Builder $clientQuery) use ($search) {
                        $clientQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $this->applyReadinessFilter($query, 'import', $readinessFilter);

        return $query;
    }

    private function buildExportQueueBaseQuery(
        string $search,
        string $statusFilter,
        string $readinessFilter,
        ?int $assignedUserId,
    ): Builder {
        $query = ExportTransaction::query()
            ->leftJoin('export_stages', 'export_stages.export_transaction_id', '=', 'export_transactions.id')
            ->selectRaw("
                export_transactions.id,
                'export' as type,
                export_transactions.created_at as created_at,
                COALESCE(export_stages.billing_completed_at, export_transactions.updated_at) as finalized_at
            ")
            ->where('export_transactions.is_archive', false)
            ->whereIn('export_transactions.status', $this->exportStatusValues($statusFilter));

        if ($assignedUserId !== null) {
            $query->where('export_transactions.assigned_user_id', $assignedUserId);
        }

        if ($search !== '') {
            $query->where(function (Builder $searchQuery) use ($search) {
                $searchQuery
                    ->where('export_transactions.bl_no', 'like', "%{$search}%")
                    ->orWhereRaw($this->exportReferenceExpression().' like ?', ["%{$search}%"])
                    ->orWhereHas('shipper', function (Builder $clientQuery) use ($search) {
                        $clientQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $this->applyReadinessFilter($query, 'export', $readinessFilter);

        return $query;
    }

    private function loadQueueImports(Collection $ids): Collection
    {
        if ($ids->isEmpty()) {
            return collect();
        }

        return ImportTransaction::query()
            ->select([
                'id',
                'customs_ref_no',
                'bl_no',
                'importer_id',
                'assigned_user_id',
                'status',
                'updated_at',
            ])
            ->with([
                'importer:id,name',
                'assignedUser:id,name',
                'stages:import_transaction_id,billing_completed_at,bonds_not_applicable',
                'documents:id,documentable_id,documentable_type,type',
                'remarks:id,remarkble_id,remarkble_type,is_resolved',
            ])
            ->whereIn('id', $ids->all())
            ->get()
            ->keyBy('id');
    }

    private function loadQueueExports(Collection $ids): Collection
    {
        if ($ids->isEmpty()) {
            return collect();
        }

        return ExportTransaction::query()
            ->select([
                'id',
                'bl_no',
                'shipper_id',
                'assigned_user_id',
                'status',
                'updated_at',
            ])
            ->with([
                'shipper:id,name',
                'assignedUser:id,name',
                'stages:export_transaction_id,billing_completed_at,co_not_applicable',
                'documents:id,documentable_id,documentable_type,type',
                'remarks:id,remarkble_id,remarkble_type,is_resolved',
            ])
            ->whereIn('id', $ids->all())
            ->get()
            ->keyBy('id');
    }

    private function mapQueueRows(Collection $items, Collection $imports, Collection $exports): array
    {
        $rows = [];

        foreach ($items as $item) {
            if ($item->type === 'import') {
                $transaction = $imports->get($item->id);

                if (! $transaction) {
                    continue;
                }

                $requiredTypes = $this->requiredTypeKeysFor('import', $transaction);
                $hasExceptions = $this->hasUnresolvedRemarks($transaction->remarks);
                $requiredCompleted = $this->countUploadedRequiredTypes($transaction->documents, $requiredTypes);
                $archiveReady = $requiredCompleted === count($requiredTypes) && ! $hasExceptions;

                $rows[] = [
                    'id' => $transaction->id,
                    'type' => 'import',
                    'ref' => $this->importReferenceFor($transaction),
                    'bl_number' => $transaction->bl_no,
                    'client' => $transaction->importer?->name,
                    'assigned_user' => $transaction->assignedUser?->name,
                    'assigned_user_id' => $transaction->assigned_user_id,
                    'status' => $transaction->status->value,
                    'finalized_date' => $this->formatDateTime($this->finalizedDateForImport($transaction)),
                    'docs_count' => $requiredCompleted,
                    'docs_total' => count($requiredTypes),
                    'has_exceptions' => $hasExceptions,
                    'archive_ready' => $archiveReady,
                    'readiness' => $this->readinessFor($archiveReady, $hasExceptions),
                ];

                continue;
            }

            $transaction = $exports->get($item->id);

            if (! $transaction) {
                continue;
            }

            $requiredTypes = $this->requiredTypeKeysFor('export', $transaction);
            $hasExceptions = $this->hasUnresolvedRemarks($transaction->remarks);
            $requiredCompleted = $this->countUploadedRequiredTypes($transaction->documents, $requiredTypes);
            $archiveReady = $requiredCompleted === count($requiredTypes) && ! $hasExceptions;

            $rows[] = [
                'id' => $transaction->id,
                'type' => 'export',
                'ref' => $this->exportReferenceFor($transaction),
                'bl_number' => $transaction->bl_no,
                'client' => $transaction->shipper?->name,
                'assigned_user' => $transaction->assignedUser?->name,
                'assigned_user_id' => $transaction->assigned_user_id,
                'status' => $transaction->status->value,
                'finalized_date' => $this->formatDateTime($this->finalizedDateForExport($transaction)),
                'docs_count' => $requiredCompleted,
                'docs_total' => count($requiredTypes),
                'has_exceptions' => $hasExceptions,
                'archive_ready' => $archiveReady,
                'readiness' => $this->readinessFor($archiveReady, $hasExceptions),
            ];
        }

        return $rows;
    }

    private function mapDetailTransaction(ImportTransaction|ExportTransaction $transaction, string $type): array
    {
        return [
            'id' => $transaction->id,
            'type' => $type,
            'ref' => $type === 'import'
                ? $this->importReferenceFor($transaction)
                : $this->exportReferenceFor($transaction),
            'bl_number' => $transaction->bl_no,
            'client' => $type === 'import'
                ? $transaction->importer?->name
                : $transaction->shipper?->name,
            'assigned_user' => $transaction->assignedUser?->name,
            'assigned_user_id' => $transaction->assigned_user_id,
            'status' => $transaction->status->value,
            'finalized_date' => $this->formatDateTime(
                $type === 'import'
                    ? $this->finalizedDateForImport($transaction)
                    : $this->finalizedDateForExport($transaction)
            ),
        ];
    }

    private function resolveReviewTransaction(string $type, int $id): ImportTransaction|ExportTransaction
    {
        return match ($type) {
            'import' => ImportTransaction::query()
                ->select([
                    'id',
                    'customs_ref_no',
                    'bl_no',
                    'importer_id',
                    'assigned_user_id',
                    'status',
                    'updated_at',
                ])
                ->whereKey($id)
                ->where('is_archive', false)
                ->whereIn('status', $this->importStatusValues('all'))
                ->with([
                    'importer:id,name',
                    'assignedUser:id,name',
                    'stages:import_transaction_id,billing_completed_at,bonds_not_applicable',
                    'documents' => function ($query) {
                        $query->select([
                            'id',
                            'documentable_id',
                            'documentable_type',
                            'type',
                            'filename',
                            'size_bytes',
                            'uploaded_by',
                            'created_at',
                        ])->with('uploadedBy:id,name')->orderByDesc('created_at');
                    },
                    'remarks' => function ($query) {
                        $query->select([
                            'id',
                            'remarkble_id',
                            'remarkble_type',
                            'author_id',
                            'message',
                            'is_resolved',
                            'created_at',
                        ])->with('author:id,name')->orderByDesc('created_at');
                    },
                ])
                ->firstOrFail(),
            'export' => ExportTransaction::query()
                ->select([
                    'id',
                    'bl_no',
                    'shipper_id',
                    'assigned_user_id',
                    'status',
                    'updated_at',
                ])
                ->whereKey($id)
                ->where('is_archive', false)
                ->whereIn('status', $this->exportStatusValues('all'))
                ->with([
                    'shipper:id,name',
                    'assignedUser:id,name',
                    'stages:export_transaction_id,billing_completed_at,co_not_applicable',
                    'documents' => function ($query) {
                        $query->select([
                            'id',
                            'documentable_id',
                            'documentable_type',
                            'type',
                            'filename',
                            'size_bytes',
                            'uploaded_by',
                            'created_at',
                        ])->with('uploadedBy:id,name')->orderByDesc('created_at');
                    },
                    'remarks' => function ($query) {
                        $query->select([
                            'id',
                            'remarkble_id',
                            'remarkble_type',
                            'author_id',
                            'message',
                            'is_resolved',
                            'created_at',
                        ])->with('author:id,name')->orderByDesc('created_at');
                    },
                ])
                ->firstOrFail(),
            default => abort(404, 'Invalid transaction type.'),
        };
    }

    /**
     * @return list<string>
     */
    private function displayTypeKeysFor(string $type): array
    {
        return Document::requiredTypeKeysFor(
            $type === 'import' ? ImportTransaction::class : ExportTransaction::class,
        );
    }

    /**
     * @return list<string>
     */
    private function requiredTypeKeysFor(
        string $type,
        ImportTransaction|ExportTransaction|null $transaction = null,
    ): array {
        if ($transaction) {
            return $transaction->requiredDocumentTypeKeys();
        }

        return $this->displayTypeKeysFor($type);
    }

    private function normalizeTypeFilter(mixed $value): string
    {
        $normalized = strtolower(trim((string) $value));

        return in_array($normalized, ['import', 'export'], true) ? $normalized : 'all';
    }

    private function normalizeStatusFilter(mixed $value): string
    {
        $normalized = strtolower(trim((string) $value));

        return in_array($normalized, ['completed', 'cancelled'], true) ? $normalized : 'all';
    }

    private function normalizeReadinessFilter(mixed $value): string
    {
        $normalized = strtolower(trim((string) $value));

        return in_array($normalized, ['ready', 'missing_docs', 'flagged'], true) ? $normalized : 'all';
    }

    private function normalizeAssignedUserFilter(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        $assignedUserId = (int) $value;

        return $assignedUserId > 0 ? $assignedUserId : null;
    }

    private function importStatusValues(string $statusFilter): array
    {
        return match ($statusFilter) {
            'completed' => [ImportStatus::Completed->value],
            'cancelled' => [ImportStatus::Cancelled->value],
            default => [ImportStatus::Completed->value, ImportStatus::Cancelled->value],
        };
    }

    private function exportStatusValues(string $statusFilter): array
    {
        return match ($statusFilter) {
            'completed' => [ExportStatus::Completed->value],
            'cancelled' => [ExportStatus::Cancelled->value],
            default => [ExportStatus::Completed->value, ExportStatus::Cancelled->value],
        };
    }

    private function importReferenceFor(ImportTransaction $transaction): string
    {
        return $transaction->customs_ref_no ?: 'IMP-'.str_pad((string) $transaction->id, 4, '0', STR_PAD_LEFT);
    }

    private function exportReferenceFor(ExportTransaction $transaction): string
    {
        return 'EXP-'.str_pad((string) $transaction->id, 4, '0', STR_PAD_LEFT);
    }

    private function countUploadedRequiredTypes(Collection $documents, array $requiredTypes): int
    {
        return $documents->pluck('type')->filter()->unique()->intersect($requiredTypes)->count();
    }

    private function readinessFor(bool $archiveReady, bool $hasExceptions): string
    {
        if ($hasExceptions) {
            return 'flagged';
        }

        return $archiveReady ? 'ready' : 'missing_docs';
    }

    private function hasUnresolvedRemarks(Collection $remarks): bool
    {
        return $remarks->contains(fn ($remark) => ! $remark->is_resolved);
    }

    private function finalizedDateForImport(ImportTransaction $transaction): mixed
    {
        return $transaction->stages?->billing_completed_at ?? $transaction->updated_at;
    }

    private function finalizedDateForExport(ExportTransaction $transaction): mixed
    {
        return $transaction->stages?->billing_completed_at ?? $transaction->updated_at;
    }

    private function formatDateTime(mixed $value): ?string
    {
        if (! $value instanceof DateTimeInterface) {
            return null;
        }

        return $value->format(DateTimeInterface::ATOM);
    }

    private function countWithAllRequiredDocuments(Builder $query, string $type): int
    {
        return $this->applyRequiredDocumentsConstraint($query, $type)->count();
    }

    private function countArchiveReady(Builder $query, string $type): int
    {
        return $this->applyRequiredDocumentsConstraint($query, $type)
            ->whereDoesntHave('remarks', function (Builder $remarkQuery) {
                $remarkQuery->where('is_resolved', false);
            })
            ->count();
    }

    private function applyReadinessFilter(Builder $query, string $type, string $readinessFilter): Builder
    {
        return match ($readinessFilter) {
            'ready' => $this->applyRequiredDocumentsConstraint($query, $type)
                ->whereDoesntHave('remarks', function (Builder $remarkQuery) {
                    $remarkQuery->where('is_resolved', false);
                }),
            'missing_docs' => $query
                ->whereDoesntHave('remarks', function (Builder $remarkQuery) {
                    $remarkQuery->where('is_resolved', false);
                })
                ->where(fn (Builder $missingQuery) => $this->applyMissingRequiredDocumentsConstraint($missingQuery, $type)),
            'flagged' => $query->whereHas('remarks', function (Builder $remarkQuery) {
                $remarkQuery->where('is_resolved', false);
            }),
            default => $query,
        };
    }

    private function applyRequiredDocumentsConstraint(Builder $query, string $type): Builder
    {
        $optionalStageColumns = $this->optionalStageColumnsFor($type);

        foreach ($this->requiredTypeKeysFor($type) as $typeKey) {
            $optionalStageColumn = $optionalStageColumns[$typeKey] ?? null;

            if ($optionalStageColumn !== null) {
                $query->where(function (Builder $stageQuery) use ($optionalStageColumn, $typeKey) {
                    $stageQuery
                        ->where($optionalStageColumn, true)
                        ->orWhereHas('documents', function (Builder $documentQuery) use ($typeKey) {
                            $documentQuery->where('type', $typeKey);
                        });
                });

                continue;
            }

            $query->whereHas('documents', function (Builder $documentQuery) use ($typeKey) {
                $documentQuery->where('type', $typeKey);
            });
        }

        return $query;
    }

    private function applyMissingRequiredDocumentsConstraint(Builder $query, string $type): Builder
    {
        $optionalStageColumns = $this->optionalStageColumnsFor($type);

        foreach ($this->requiredTypeKeysFor($type) as $typeKey) {
            $optionalStageColumn = $optionalStageColumns[$typeKey] ?? null;

            if ($optionalStageColumn !== null) {
                $query->orWhere(function (Builder $missingStageQuery) use ($optionalStageColumn, $typeKey) {
                    $missingStageQuery
                        ->where(function (Builder $applicableStageQuery) use ($optionalStageColumn) {
                            $applicableStageQuery
                                ->whereNull($optionalStageColumn)
                                ->orWhere($optionalStageColumn, false);
                        })
                        ->whereDoesntHave('documents', function (Builder $documentQuery) use ($typeKey) {
                            $documentQuery->where('type', $typeKey);
                        });
                });

                continue;
            }

            $query->orWhereDoesntHave('documents', function (Builder $documentQuery) use ($typeKey) {
                $documentQuery->where('type', $typeKey);
            });
        }

        return $query;
    }

    /**
     * @return array<string, string>
     */
    private function optionalStageColumnsFor(string $type): array
    {
        return match ($type) {
            'import' => ['bonds' => 'import_stages.bonds_not_applicable'],
            'export' => ['co' => 'export_stages.co_not_applicable'],
            default => [],
        };
    }

    private function exportReferenceExpression(): string
    {
        return match (DB::connection()->getDriverName()) {
            'sqlite' => "'EXP-' || printf('%04d', export_transactions.id)",
            default => "CONCAT('EXP-', LPAD(export_transactions.id, 4, '0'))",
        };
    }
}
