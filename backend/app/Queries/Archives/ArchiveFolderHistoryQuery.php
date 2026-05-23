<?php

namespace App\Queries\Archives;

use App\Data\Archives\ArchiveFolderHistoryFilters;
use App\Models\Client;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class ArchiveFolderHistoryQuery
{
    /**
     * @return array{
     *     data: list<array<string, mixed>>,
     *     summary: array<string, mixed>,
     *     meta: array<string, int|null>
     * }
     */
    public function handle(
        User $user,
        ArchiveFolderHistoryFilters $filters,
    ): array {
        $baseQuery = $this->baseQuery(
            $user,
            $filters->mine,
            $filters->year,
            $filters->month,
            $filters->type,
            $filters->search,
        );
        $totalBlRecords = (clone $baseQuery)->count();
        $completeBlRecords = $this->applyCompletionFilter(clone $baseQuery, $filters->type, 'complete')->count();
        $totalFiles = (clone $baseQuery)
            ->withCount('documents')
            ->pluck('documents_count')
            ->sum();
        $latestUploadedAt = $this->latestUploadedAt(clone $baseQuery, $filters->type);

        $historyQuery = $filters->completion === 'all'
            ? $baseQuery
            : $this->applyCompletionFilter($baseQuery, $filters->type, $filters->completion);

        $paginator = $this->applySort(
            $historyQuery->withCount('documents'),
            $filters->type,
            $filters->sort,
            $filters->direction,
        )->paginate($filters->perPage);

        return [
            'data' => $paginator->getCollection()
                ->map(fn (ImportTransaction|ExportTransaction $transaction): array => $this->formatTransaction($transaction, $filters->type))
                ->values()
                ->all(),
            'summary' => [
                'total_bl_records' => $totalBlRecords,
                'complete_bl_records' => $completeBlRecords,
                'incomplete_bl_records' => max(0, $totalBlRecords - $completeBlRecords),
                'total_files' => (int) $totalFiles,
                'latest_uploaded_at' => $latestUploadedAt,
            ],
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }

    /**
     * @return Builder<ImportTransaction|ExportTransaction>
     */
    private function baseQuery(
        User $user,
        bool $mine,
        int $year,
        int $month,
        string $type,
        ?string $search,
    ): Builder {
        $modelClass = $this->modelClass($type);
        $dateColumn = $this->dateColumn($type);

        $query = $modelClass::query()
            ->where('is_archive', true)
            ->with([
                'documents.uploadedBy',
                'stages',
                $type === 'import' ? 'importer' : 'shipper',
                $type === 'import' ? 'originCountry' : 'destinationCountry',
                ...($type === 'import' ? ['locationOfGoods'] : []),
            ])
            ->where(function (Builder $dateQuery) use ($dateColumn, $year, $month): void {
                $dateQuery
                    ->where(function (Builder $primaryDateQuery) use ($dateColumn, $year, $month): void {
                        $primaryDateQuery
                            ->whereNotNull($dateColumn)
                            ->whereYear($dateColumn, $year)
                            ->whereMonth($dateColumn, $month);
                    })
                    ->orWhere(function (Builder $fallbackDateQuery) use ($dateColumn, $year, $month): void {
                        $fallbackDateQuery
                            ->whereNull($dateColumn)
                            ->whereYear('created_at', $year)
                            ->whereMonth('created_at', $month);
                    });
            });

        if ($mine) {
            $query->where('assigned_user_id', $user->id);
        }

        if ($search !== null) {
            $this->applySearch($query, $type, $search);
        }

        return $query;
    }

    /**
     * @param  Builder<ImportTransaction|ExportTransaction>  $query
     * @return Builder<ImportTransaction|ExportTransaction>
     */
    private function applySort(Builder $query, string $type, string $sort, string $direction): Builder
    {
        return match ($sort) {
            'bl' => $query
                ->orderBy('bl_no', $direction)
                ->orderByDesc($this->dateColumn($type)),
            'client' => $query
                ->orderBy(
                    Client::query()
                        ->select('name')
                        ->whereColumn('clients.id', $type === 'import' ? 'import_transactions.importer_id' : 'export_transactions.shipper_id')
                        ->limit(1),
                    $direction,
                )
                ->orderBy('bl_no'),
            'files' => $query
                ->orderBy('documents_count', $direction)
                ->orderBy('bl_no'),
            default => $query
                ->orderByRaw('COALESCE('.$this->dateColumn($type).', created_at) '.$direction)
                ->orderBy('bl_no'),
        };
    }

    /**
     * @param  Builder<ImportTransaction|ExportTransaction>  $query
     */
    private function applySearch(Builder $query, string $type, string $search): void
    {
        $relation = $type === 'import' ? 'importer' : 'shipper';

        $query->where(function (Builder $searchQuery) use ($relation, $search): void {
            $searchQuery
                ->where('bl_no', 'like', "%{$search}%")
                ->orWhereHas($relation, function (Builder $clientQuery) use ($search): void {
                    /** @var Builder<Client> $clientQuery */
                    $clientQuery->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('documents', function (Builder $documentQuery) use ($search): void {
                    /** @var Builder<Document> $documentQuery */
                    $documentQuery
                        ->where('filename', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%")
                        ->orWhereHas('uploadedBy', function (Builder $userQuery) use ($search): void {
                            $userQuery->where('name', 'like', "%{$search}%");
                        });
                });
        });
    }

    /**
     * @param  Builder<ImportTransaction|ExportTransaction>  $query
     * @return Builder<ImportTransaction|ExportTransaction>
     */
    private function applyCompletionFilter(Builder $query, string $type, string $completion): Builder
    {
        return $completion === 'complete'
            ? $query->where(fn (Builder $completeQuery): Builder => $this->applyCompleteConditions($completeQuery, $type))
            : $query->where(fn (Builder $incompleteQuery): Builder => $this->applyIncompleteConditions($incompleteQuery, $type));
    }

    /**
     * @param  Builder<ImportTransaction|ExportTransaction>  $query
     * @return Builder<ImportTransaction|ExportTransaction>
     */
    private function applyCompleteConditions(Builder $query, string $type): Builder
    {
        $modelClass = $this->modelClass($type);
        $optionalFlags = $modelClass::optionalStageFlagMap();

        foreach ($this->documentStageKeys($type) as $stage) {
            $flag = $optionalFlags[$stage] ?? null;

            if ($flag === null) {
                $query->whereHas('documents', fn (Builder $documentQuery): Builder => $documentQuery->where('type', $stage));

                continue;
            }

            $query->where(function (Builder $stageQuery) use ($stage, $flag): void {
                $stageQuery
                    ->whereHas('documents', fn (Builder $documentQuery): Builder => $documentQuery->where('type', $stage))
                    ->orWhereHas('stages', fn (Builder $stagesQuery): Builder => $stagesQuery->where($flag, true));
            });
        }

        return $query;
    }

    /**
     * @param  Builder<ImportTransaction|ExportTransaction>  $query
     * @return Builder<ImportTransaction|ExportTransaction>
     */
    private function applyIncompleteConditions(Builder $query, string $type): Builder
    {
        $modelClass = $this->modelClass($type);
        $optionalFlags = $modelClass::optionalStageFlagMap();

        $query->where(function (Builder $missingQuery) use ($optionalFlags, $type): void {
            foreach ($this->documentStageKeys($type) as $stage) {
                $flag = $optionalFlags[$stage] ?? null;

                if ($flag === null) {
                    $missingQuery->orWhereDoesntHave('documents', fn (Builder $documentQuery): Builder => $documentQuery->where('type', $stage));

                    continue;
                }

                $missingQuery->orWhere(function (Builder $optionalStageQuery) use ($stage, $flag): void {
                    $optionalStageQuery
                        ->whereDoesntHave('documents', fn (Builder $documentQuery): Builder => $documentQuery->where('type', $stage))
                        ->where(function (Builder $flagQuery) use ($flag): void {
                            $flagQuery
                                ->whereDoesntHave('stages')
                                ->orWhereHas('stages', fn (Builder $stagesQuery): Builder => $stagesQuery->where($flag, false));
                        });
                });
            }
        });

        return $query;
    }

    /**
     * @param  Builder<ImportTransaction|ExportTransaction>  $query
     */
    private function latestUploadedAt(Builder $query, string $type): ?string
    {
        $latestDocument = Document::query()
            ->where('documentable_type', $this->modelClass($type))
            ->whereIn('documentable_id', (clone $query)->select('id'))
            ->latest('created_at')
            ->first();

        return $latestDocument?->created_at?->toIso8601String();
    }

    /**
     * @return array<string, mixed>
     */
    private function formatTransaction(ImportTransaction|ExportTransaction $transaction, string $type): array
    {
        $documents = $transaction->documents
            ->sortByDesc('created_at')
            ->map(fn (Document $document): array => $this->formatDocument($document, $transaction, $type))
            ->values();
        $uploadedStageKeys = $documents->pluck('stage')->unique()->values()->all();
        $notApplicableStages = $transaction->notApplicableStageKeys();
        $requiredStages = Document::requiredTypeKeysFor($this->modelClass($type), $notApplicableStages);
        $doneCount = count(array_intersect($requiredStages, $uploadedStageKeys));
        $latestDocument = $transaction->documents->sortByDesc('created_at')->first();

        return [
            'bl_no' => $transaction->bl_no,
            'type' => $type,
            'transaction_id' => $transaction->id,
            'documentable_type' => $this->modelClass($type),
            'client' => $type === 'import'
                ? ($transaction->importer?->name ?? 'Unknown')
                : ($transaction->shipper?->name ?? 'Unknown'),
            'transaction_date' => (($type === 'import' ? $transaction->arrival_date : $transaction->export_date) ?? $transaction->created_at)->toDateString(),
            'not_applicable_stages' => $notApplicableStages,
            'required_stages' => $requiredStages,
            'uploaded_stage_count' => $doneCount,
            'required_stage_count' => count($requiredStages),
            'is_complete' => $doneCount === count($requiredStages),
            'latest_uploaded_at' => $latestDocument?->created_at?->toIso8601String(),
            'latest_uploader' => $latestDocument?->uploadedBy ? [
                'id' => $latestDocument->uploadedBy->id,
                'name' => $latestDocument->uploadedBy->name,
            ] : null,
            'documents' => $documents->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatDocument(Document $document, ImportTransaction|ExportTransaction $transaction, string $type): array
    {
        return [
            'id' => $document->id,
            'type' => $type,
            'bl_no' => $transaction->bl_no,
            'customs_ref_no' => $transaction instanceof ImportTransaction ? $transaction->customs_ref_no : null,
            'month' => (int) (($type === 'import' ? $transaction->arrival_date : $transaction->export_date) ?? $transaction->created_at)->month,
            'client' => $type === 'import'
                ? ($transaction->importer?->name ?? 'Unknown')
                : ($transaction->shipper?->name ?? 'Unknown'),
            'client_id' => $type === 'import' ? $transaction->importer_id : $transaction->shipper_id,
            'selective_color' => $transaction instanceof ImportTransaction ? $transaction->selective_color : null,
            'origin_country' => $transaction instanceof ImportTransaction ? $transaction->originCountry?->name : null,
            'origin_country_id' => $transaction instanceof ImportTransaction ? $transaction->origin_country_id : null,
            'destination_country' => $transaction instanceof ExportTransaction ? $transaction->destinationCountry?->name : null,
            'destination_country_id' => $transaction instanceof ExportTransaction ? $transaction->destination_country_id : null,
            'vessel_name' => $transaction instanceof ImportTransaction ? $transaction->vessel_name : $transaction->vessel,
            'location_of_goods' => $transaction instanceof ImportTransaction ? $transaction->locationOfGoods?->name : null,
            'location_of_goods_id' => $transaction instanceof ImportTransaction ? $transaction->location_of_goods_id : null,
            'transaction_date' => (($type === 'import' ? $transaction->arrival_date : $transaction->export_date) ?? $transaction->created_at)->toDateString(),
            'transaction_id' => $transaction->id,
            'documentable_type' => $this->modelClass($type),
            'stage' => $document->type,
            'filename' => $document->filename,
            'formatted_size' => $document->formatted_size,
            'size_bytes' => $document->size_bytes,
            'archive_origin' => $transaction->archive_origin?->value,
            'archived_at' => $transaction->archived_at?->toIso8601String(),
            'uploaded_at' => $document->created_at?->toIso8601String(),
            'not_applicable_stages' => $transaction->notApplicableStageKeys(),
            'uploader' => $document->uploadedBy ? [
                'id' => $document->uploadedBy->id,
                'name' => $document->uploadedBy->name,
            ] : null,
        ];
    }

    private function dateColumn(string $type): string
    {
        return $type === 'import' ? 'arrival_date' : 'export_date';
    }

    /**
     * @return class-string<ImportTransaction|ExportTransaction>
     */
    private function modelClass(string $type): string
    {
        return $type === 'import' ? ImportTransaction::class : ExportTransaction::class;
    }

    /**
     * @return list<string>
     */
    private function documentStageKeys(string $type): array
    {
        return array_values(array_filter(
            Document::allowedTypeKeysFor($this->modelClass($type)),
            fn (string $stage): bool => $stage !== 'others',
        ));
    }
}
