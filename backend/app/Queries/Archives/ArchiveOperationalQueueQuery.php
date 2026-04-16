<?php

namespace App\Queries\Archives;

use App\Enums\UserRole;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ArchiveOperationalQueueQuery
{
    /**
     * @return array{
     *     stats: array{
     *         needs_my_upload: int,
     *         waiting_on_others: int,
     *         completed_by_me: int,
     *         already_supplied: int,
     *         shared_records: int
     *     },
     *     data: list<array<string, mixed>>
     * }
     */
    public function handle(User $user): array
    {
        $records = $this->archiveTransactionsFor($user)
            ->sortByDesc(fn (array $record): int => Carbon::parse($record['last_updated_at'])->getTimestamp())
            ->values();

        return [
            'stats' => [
                'needs_my_upload' => $records->where('queue_status', 'needs_my_upload')->count(),
                'waiting_on_others' => $records->where('queue_status', 'waiting_on_others')->count(),
                'completed_by_me' => $records->where('queue_status', 'completed_by_me')->count(),
                'already_supplied' => $records->where('queue_status', 'already_supplied')->count(),
                'shared_records' => $records->count(),
            ],
            'data' => $records->all(),
        ];
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function archiveTransactionsFor(User $user): Collection
    {
        return collect()
            ->concat($this->mapImportTransactions($user))
            ->concat($this->mapExportTransactions($user));
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function mapImportTransactions(User $user): Collection
    {
        return ImportTransaction::query()
            ->where('is_archive', true)
            ->with([
                'importer:id,name',
                'originCountry:id,name,code',
                'locationOfGoods:id,name',
                'stages',
                'documents' => fn ($query) => $query
                    ->with('uploadedBy:id,name,role')
                    ->orderByDesc('created_at'),
            ])
            ->get()
            ->map(fn (ImportTransaction $transaction): array => $this->mapTransactionRecord($transaction, $user, 'import'));
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    private function mapExportTransactions(User $user): Collection
    {
        return ExportTransaction::query()
            ->where('is_archive', true)
            ->with([
                'shipper:id,name',
                'destinationCountry:id,name,code',
                'stages',
                'documents' => fn ($query) => $query
                    ->with('uploadedBy:id,name,role')
                    ->orderByDesc('created_at'),
            ])
            ->get()
            ->map(fn (ExportTransaction $transaction): array => $this->mapTransactionRecord($transaction, $user, 'export'));
    }

    /**
     * @return array<string, mixed>
     */
    private function mapTransactionRecord(
        ImportTransaction|ExportTransaction $transaction,
        User $user,
        string $type,
    ): array {
        $ownedStageKeys = $this->ownedStageKeys($transaction, $user);
        $documents = $transaction->documents instanceof EloquentCollection
            ? $transaction->documents->sortByDesc('created_at')->values()
            : collect();
        $documentsByType = $documents->groupBy('type');
        $notApplicableStageKeys = $transaction->notApplicableStageKeys();
        $requiredStageKeys = $transaction->requiredDocumentTypeKeys();
        $lastUpdatedAt = $documents->max('updated_at') ?? $transaction->updated_at ?? $transaction->created_at ?? now();

        $ownedStageSummaries = collect($ownedStageKeys)
            ->map(fn (string $stageKey): array => $this->mapOwnedStageSummary(
                $stageKey,
                $documentsByType->get($stageKey, collect()),
                $user,
                $notApplicableStageKeys,
            ))
            ->values();

        $hasMissingOwnedStage = $ownedStageSummaries->contains(fn (array $stage): bool => $stage['state'] === 'missing');
        $hasMyOwnedContribution = $ownedStageSummaries->contains(fn (array $stage): bool => in_array($stage['state'], ['uploaded_by_me', 'shared'], true));
        $overallComplete = collect($requiredStageKeys)->every(
            fn (string $stageKey): bool => in_array($stageKey, $notApplicableStageKeys, true)
                || $documentsByType->has($stageKey),
        );

        $queueStatus = match (true) {
            $hasMissingOwnedStage => 'needs_my_upload',
            ! $overallComplete => 'waiting_on_others',
            $hasMyOwnedContribution => 'completed_by_me',
            default => 'already_supplied',
        };

        return [
            'id' => $transaction->id,
            'type' => $type,
            'reference' => $type === 'import'
                ? ($transaction->customs_ref_no ?: $transaction->bl_no)
                : $transaction->bl_no,
            'bl_no' => $transaction->bl_no,
            'client_name' => $type === 'import'
                ? $transaction->importer?->name
                : $transaction->shipper?->name,
            'transaction_date' => $this->transactionDateFor($transaction)?->toDateString(),
            'archive_period' => $this->archivePeriodFor($transaction),
            'status' => $transaction->status->value,
            'notes' => $transaction->notes,
            'selective_color' => $type === 'import' ? $transaction->selective_color : null,
            'vessel_name' => $type === 'import' ? $transaction->vessel_name : $transaction->vessel,
            'origin_country' => $type === 'import'
                ? $transaction->originCountry?->name
                : $transaction->destinationCountry?->name,
            'location_of_goods' => $type === 'import'
                ? $transaction->locationOfGoods?->name
                : null,
            'stages' => $transaction->progress,
            'not_applicable_stages' => $notApplicableStageKeys,
            'my_stage_keys' => $ownedStageKeys,
            'my_stage_summaries' => $ownedStageSummaries->all(),
            'documents' => $documents
                ->map(fn (Document $document): array => $this->mapDocument($document))
                ->all(),
            'contributors' => $documents
                ->map(fn (Document $document) => $document->uploadedBy)
                ->filter()
                ->unique('id')
                ->map(fn (User $contributor): array => [
                    'id' => $contributor->id,
                    'name' => $contributor->name,
                    'role' => $contributor->role?->value,
                ])
                ->values()
                ->all(),
            'queue_status' => $queueStatus,
            'last_updated_at' => $lastUpdatedAt?->toIso8601String(),
        ];
    }

    /**
     * @param  Collection<int, Document>  $documents
     * @param  list<string>  $notApplicableStageKeys
     * @return array<string, mixed>
     */
    private function mapOwnedStageSummary(
        string $stageKey,
        Collection $documents,
        User $user,
        array $notApplicableStageKeys,
    ): array {
        $latestDocument = $documents->sortByDesc('created_at')->first();
        $hasMyDocument = $documents->contains(fn (Document $document): bool => $document->uploaded_by === $user->id);
        $hasOtherContributor = $documents->contains(fn (Document $document): bool => $document->uploaded_by !== $user->id);
        $primaryUploader = $latestDocument?->uploadedBy;

        $state = match (true) {
            in_array($stageKey, $notApplicableStageKeys, true) => 'not_applicable',
            $documents->isEmpty() => 'missing',
            $hasMyDocument && $hasOtherContributor => 'shared',
            $hasMyDocument => 'uploaded_by_me',
            $primaryUploader?->role === UserRole::Admin => 'uploaded_by_admin',
            $primaryUploader?->role === UserRole::Encoder => 'uploaded_by_encoder',
            default => 'uploaded_by_other_staff',
        };

        return [
            'key' => $stageKey,
            'label' => Document::getTypeLabels()[$stageKey] ?? str($stageKey)->replace('_', ' ')->title()->value(),
            'state' => $state,
            'can_upload' => $state === 'missing',
            'documents_count' => $documents->count(),
            'uploaded_by' => $primaryUploader ? [
                'id' => $primaryUploader->id,
                'name' => $primaryUploader->name,
                'role' => $primaryUploader->role?->value,
            ] : null,
        ];
    }

    /**
     * @return array{id: int, type: string, filename: string, formatted_size: string, created_at: string|null, uploaded_by: array{id: int, name: string, role: string|null}|null}
     */
    private function mapDocument(Document $document): array
    {
        return [
            'id' => $document->id,
            'type' => $document->type,
            'filename' => $document->filename,
            'formatted_size' => $document->formatted_size,
            'created_at' => $document->created_at?->toIso8601String(),
            'uploaded_by' => $document->uploadedBy ? [
                'id' => $document->uploadedBy->id,
                'name' => $document->uploadedBy->name,
                'role' => $document->uploadedBy->role?->value,
            ] : null,
        ];
    }

    /**
     * @return list<string>
     */
    private function ownedStageKeys(ImportTransaction|ExportTransaction $transaction, User $user): array
    {
        if ($transaction instanceof ImportTransaction) {
            return match ($user->role) {
                UserRole::Processor => ImportTransaction::processorOperationalDocumentTypes(),
                UserRole::Accounting => ImportTransaction::accountingOperationalDocumentTypes(),
                default => [],
            };
        }

        return match ($user->role) {
            UserRole::Processor => ExportTransaction::processorOperationalDocumentTypes(),
            UserRole::Accounting => ExportTransaction::accountingOperationalDocumentTypes(),
            default => [],
        };
    }

    /**
     * @return array{year: int|null, month: int|null, label: string|null}
     */
    private function archivePeriodFor(ImportTransaction|ExportTransaction $transaction): array
    {
        $transactionDate = $this->transactionDateFor($transaction);

        return [
            'year' => $transactionDate?->year,
            'month' => $transactionDate?->month,
            'label' => $transactionDate?->format('F Y'),
        ];
    }

    private function transactionDateFor(ImportTransaction|ExportTransaction $transaction): ?Carbon
    {
        return $transaction instanceof ImportTransaction
            ? $transaction->arrival_date
            : $transaction->export_date;
    }
}
