<?php

namespace App\Queries\Archives;

use App\Data\Archives\ArchiveDocumentIndexFilters;
use App\Models\Client;
use App\Models\Country;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\LocationOfGoods;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ArchiveDocumentIndexQuery
{
    /**
     * @return array{
     *     data: list<array<string, mixed>>,
     *     meta: array<string, int|null>
     * }
     */
    public function handle(
        User $user,
        ArchiveDocumentIndexFilters $filters,
    ): array {
        $paginator = $filters->type === 'all'
            ? $this->paginateAllTypes($user, $filters)
            : $this->paginateSingleType($user, $filters);

        return [
            'data' => $this->formatPageRows($paginator->getCollection()),
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
     * @return LengthAwarePaginator<int, object>
     */
    private function paginateAllTypes(
        User $user,
        ArchiveDocumentIndexFilters $filters,
    ): LengthAwarePaginator {
        $importQuery = $this->identifierQuery(
            $this->baseQuery($user, $filters->mine, $filters->year, 'import', $filters->search, $filters->completion),
            'import',
        );
        $exportQuery = $this->identifierQuery(
            $this->baseQuery($user, $filters->mine, $filters->year, 'export', $filters->search, $filters->completion),
            'export',
        );

        return DB::query()
            ->fromSub($importQuery->unionAll($exportQuery), 'archive_documents')
            ->orderByDesc('transaction_date')
            ->orderBy('bl_no')
            ->paginate($filters->perPage);
    }

    /**
     * @return LengthAwarePaginator<int, object>
     */
    private function paginateSingleType(
        User $user,
        ArchiveDocumentIndexFilters $filters,
    ): LengthAwarePaginator {
        return DB::query()
            ->fromSub(
                $this->identifierQuery(
                    $this->baseQuery($user, $filters->mine, $filters->year, $filters->type, $filters->search, $filters->completion),
                    $filters->type,
                ),
                'archive_documents',
            )
            ->orderByDesc('transaction_date')
            ->orderBy('bl_no')
            ->paginate($filters->perPage);
    }

    /**
     * @return Builder<ImportTransaction|ExportTransaction>
     */
    private function baseQuery(
        User $user,
        bool $mine,
        ?int $year,
        string $type,
        ?string $search,
        string $completion,
    ): Builder {
        $modelClass = $this->modelClass($type);
        $dateColumn = $this->dateColumn($type);

        $query = $modelClass::query()
            ->where('is_archive', true)
            ->where(function (Builder $dateQuery) use ($dateColumn, $year): void {
                $dateQuery
                    ->where(function (Builder $primaryDateQuery) use ($dateColumn, $year): void {
                        $primaryDateQuery->whereNotNull($dateColumn);

                        if ($year !== null) {
                            $primaryDateQuery->whereYear($dateColumn, $year);
                        }
                    })
                    ->orWhere(function (Builder $fallbackDateQuery) use ($dateColumn, $year): void {
                        $fallbackDateQuery->whereNull($dateColumn);

                        if ($year !== null) {
                            $fallbackDateQuery->whereYear('created_at', $year);
                        }
                    });
            });

        if ($mine) {
            $query->where('assigned_user_id', $user->id);
        }

        if ($search !== null) {
            $this->applySearch($query, $type, $search);
        }

        if ($completion !== 'all') {
            $this->applyCompletionFilter($query, $type, $completion);
        }

        return $query;
    }

    /**
     * @param  Builder<ImportTransaction|ExportTransaction>  $query
     */
    private function identifierQuery(Builder $query, string $type): Builder
    {
        $dateColumn = $this->dateColumn($type);

        return $query
            ->select('id', 'bl_no')
            ->selectRaw($type === 'import' ? "'import' as archive_type" : "'export' as archive_type")
            ->selectRaw("COALESCE({$dateColumn}, created_at) as transaction_date");
    }

    /**
     * @param  Builder<ImportTransaction|ExportTransaction>  $query
     */
    private function applySearch(Builder $query, string $type, string $search): void
    {
        $clientRelation = $type === 'import' ? 'importer' : 'shipper';
        $countryRelation = $type === 'import' ? 'originCountry' : 'destinationCountry';

        $query->where(function (Builder $searchQuery) use ($clientRelation, $countryRelation, $search, $type): void {
            $searchQuery
                ->where('bl_no', 'like', "%{$search}%")
                ->orWhereHas($clientRelation, function (Builder $clientQuery) use ($search): void {
                    /** @var Builder<Client> $clientQuery */
                    $clientQuery->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas($countryRelation, function (Builder $countryQuery) use ($search): void {
                    /** @var Builder<Country> $countryQuery */
                    $countryQuery->where('name', 'like', "%{$search}%");
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

            if ($type === 'import') {
                $searchQuery
                    ->orWhere('customs_ref_no', 'like', "%{$search}%")
                    ->orWhere('vessel_name', 'like', "%{$search}%")
                    ->orWhereHas('locationOfGoods', function (Builder $locationQuery) use ($search): void {
                        /** @var Builder<LocationOfGoods> $locationQuery */
                        $locationQuery->where('name', 'like', "%{$search}%");
                    });

                return;
            }

            $searchQuery->orWhere('vessel', 'like', "%{$search}%");
        });
    }

    /**
     * @param  Builder<ImportTransaction|ExportTransaction>  $query
     */
    private function applyCompletionFilter(Builder $query, string $type, string $completion): void
    {
        if ($completion === 'complete') {
            $query->where(fn (Builder $completeQuery): Builder => $this->applyCompleteConditions($completeQuery, $type));

            return;
        }

        $query->where(fn (Builder $incompleteQuery): Builder => $this->applyIncompleteConditions($incompleteQuery, $type));
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

            $query->where(function (Builder $stageQuery) use ($flag, $stage): void {
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

                $missingQuery->orWhere(function (Builder $optionalStageQuery) use ($flag, $stage): void {
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
     * @param  Collection<int, object>  $identifiers
     * @return list<array<string, mixed>>
     */
    private function formatPageRows(Collection $identifiers): array
    {
        $order = $identifiers
            ->mapWithKeys(fn (object $identifier, int $index): array => ["{$identifier->archive_type}:{$identifier->id}" => $index]);

        $imports = $this->loadTransactions($identifiers, 'import');
        $exports = $this->loadTransactions($identifiers, 'export');

        return $imports
            ->toBase()
            ->merge($exports->toBase())
            ->sortBy(fn (ImportTransaction|ExportTransaction $transaction): int => $order[$this->rowKey($transaction)] ?? PHP_INT_MAX)
            ->map(fn (ImportTransaction|ExportTransaction $transaction): array => $this->formatTransaction($transaction))
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, object>  $identifiers
     * @return Collection<int, ImportTransaction|ExportTransaction>
     */
    private function loadTransactions(Collection $identifiers, string $type): Collection
    {
        $ids = $identifiers
            ->filter(fn (object $identifier): bool => $identifier->archive_type === $type)
            ->pluck('id')
            ->all();

        if ($ids === []) {
            return collect();
        }

        return $this->modelClass($type)::query()
            ->whereKey($ids)
            ->with([
                'documents.uploadedBy',
                'stages',
                $type === 'import' ? 'importer' : 'shipper',
                $type === 'import' ? 'originCountry' : 'destinationCountry',
                ...($type === 'import' ? ['locationOfGoods'] : []),
            ])
            ->get();
    }

    /**
     * @return array<string, mixed>
     */
    private function formatTransaction(ImportTransaction|ExportTransaction $transaction): array
    {
        $type = $transaction instanceof ImportTransaction ? 'import' : 'export';
        $documents = $transaction->documents
            ->sortByDesc('created_at')
            ->map(fn (Document $document): array => $this->formatDocument($document, $transaction, $type))
            ->values();
        $notApplicableStages = $transaction->notApplicableStageKeys();

        return [
            'bl_no' => $transaction->bl_no,
            'client' => $type === 'import'
                ? ($transaction->importer?->name ?? 'Unknown')
                : ($transaction->shipper?->name ?? 'Unknown'),
            'type' => $type,
            'year' => (int) $this->transactionDate($transaction, $type)->year,
            'month' => (int) $this->transactionDate($transaction, $type)->month,
            'transaction_id' => $transaction->id,
            'documentable_type' => $transaction::class,
            'not_applicable_stages' => $notApplicableStages,
            'documents' => $documents->all(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatDocument(Document $document, ImportTransaction|ExportTransaction $transaction, string $type): array
    {
        $transactionDate = $this->transactionDate($transaction, $type);

        return [
            'id' => $document->id,
            'type' => $type,
            'bl_no' => $transaction->bl_no,
            'customs_ref_no' => $transaction instanceof ImportTransaction ? $transaction->customs_ref_no : null,
            'month' => (int) $transactionDate->month,
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
            'transaction_date' => $transactionDate->toDateString(),
            'transaction_id' => $transaction->id,
            'documentable_type' => $transaction::class,
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

    private function rowKey(ImportTransaction|ExportTransaction $transaction): string
    {
        return ($transaction instanceof ImportTransaction ? 'import' : 'export').":{$transaction->id}";
    }

    private function transactionDate(ImportTransaction|ExportTransaction $transaction, string $type): Carbon
    {
        return ($type === 'import' ? $transaction->arrival_date : $transaction->export_date) ?? $transaction->created_at;
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
