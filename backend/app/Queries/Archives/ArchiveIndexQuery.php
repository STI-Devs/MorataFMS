<?php

namespace App\Queries\Archives;

use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ArchiveIndexQuery
{
    public function handle(User $user, bool $mine = false): array
    {
        $archivesByYear = [];

        $importQuery = ImportTransaction::query()
            ->select(['id', 'bl_no', 'arrival_date', 'assigned_user_id', 'created_at'])
            ->where('is_archive', true)
            ->with([
                'stages',
                'documents:id,documentable_type,documentable_id,type,size_bytes,created_at,uploaded_by',
            ]);

        if ($mine) {
            $importQuery->where('assigned_user_id', $user->id);
        }

        foreach ($importQuery->lazyById(100) as $transaction) {
            $this->addTransactionSummary($archivesByYear, $transaction, 'import', $user);
        }

        $exportQuery = ExportTransaction::query()
            ->select(['id', 'bl_no', 'export_date', 'assigned_user_id', 'created_at'])
            ->where('is_archive', true)
            ->with([
                'stages',
                'documents:id,documentable_type,documentable_id,type,size_bytes,created_at,uploaded_by',
            ]);

        if ($mine) {
            $exportQuery->where('assigned_user_id', $user->id);
        }

        foreach ($exportQuery->lazyById(100) as $transaction) {
            $this->addTransactionSummary($archivesByYear, $transaction, 'export', $user);
        }

        foreach ($archivesByYear as &$yearSummary) {
            $yearSummary['incomplete_bl_count'] = max(0, $yearSummary['bl_count'] - $yearSummary['completed_bl_count']);
            $yearSummary['folders'] = array_values($yearSummary['folders']);
            usort(
                $yearSummary['folders'],
                fn (array $first, array $second): int => $first['month'] <=> $second['month']
                    ?: $first['type'] <=> $second['type'],
            );
        }
        unset($yearSummary);

        krsort($archivesByYear);

        return array_values($archivesByYear);
    }

    /**
     * @param  array<int, array<string, mixed>>  $archivesByYear
     */
    private function addTransactionSummary(
        array &$archivesByYear,
        ImportTransaction|ExportTransaction $transaction,
        string $type,
        User $user,
    ): void {
        $transactionDate = $this->transactionDate($transaction, $type);
        $year = (int) $transactionDate->year;
        $month = (int) $transactionDate->month;
        $folderKey = "{$month}|{$type}";
        $documents = $transaction->documents;
        $fileCount = $documents->count();
        $totalSizeBytes = (int) $documents->sum(fn (Document $document): int => (int) ($document->size_bytes ?? 0));
        $latestUploadedAt = $this->latestUploadedAt($documents);
        $isComplete = $this->isComplete($transaction);
        $uploadedByUserCount = $documents->where('uploaded_by', $user->id)->count();
        $wasFirstUploadedByUserThisMonth = $this->wasFirstUploadedByUserThisMonth($documents, $user);

        $archivesByYear[$year] ??= [
            'year' => $year,
            'imports' => 0,
            'exports' => 0,
            'documents' => [],
            'folders' => [],
            'file_count' => 0,
            'bl_count' => 0,
            'completed_bl_count' => 0,
            'incomplete_bl_count' => 0,
            'total_size_bytes' => 0,
            'latest_uploaded_at' => null,
            'uploaded_file_count' => 0,
            'current_month_bl_count' => 0,
        ];

        $archivesByYear[$year][$type === 'import' ? 'imports' : 'exports']++;
        $archivesByYear[$year]['file_count'] += $fileCount;
        $archivesByYear[$year]['bl_count']++;
        $archivesByYear[$year]['completed_bl_count'] += $isComplete ? 1 : 0;
        $archivesByYear[$year]['total_size_bytes'] += $totalSizeBytes;
        $archivesByYear[$year]['uploaded_file_count'] += $uploadedByUserCount;
        $archivesByYear[$year]['current_month_bl_count'] += $wasFirstUploadedByUserThisMonth ? 1 : 0;
        $archivesByYear[$year]['latest_uploaded_at'] = $this->newerTimestamp(
            $archivesByYear[$year]['latest_uploaded_at'],
            $latestUploadedAt,
        );

        $archivesByYear[$year]['folders'][$folderKey] ??= [
            'year' => $year,
            'month' => $month,
            'type' => $type,
            'file_count' => 0,
            'bl_count' => 0,
            'completed_bl_count' => 0,
            'incomplete_bl_count' => 0,
            'total_size_bytes' => 0,
            'latest_uploaded_at' => null,
        ];

        $archivesByYear[$year]['folders'][$folderKey]['file_count'] += $fileCount;
        $archivesByYear[$year]['folders'][$folderKey]['bl_count']++;
        $archivesByYear[$year]['folders'][$folderKey]['completed_bl_count'] += $isComplete ? 1 : 0;
        $archivesByYear[$year]['folders'][$folderKey]['incomplete_bl_count'] = max(
            0,
            $archivesByYear[$year]['folders'][$folderKey]['bl_count'] - $archivesByYear[$year]['folders'][$folderKey]['completed_bl_count'],
        );
        $archivesByYear[$year]['folders'][$folderKey]['total_size_bytes'] += $totalSizeBytes;
        $archivesByYear[$year]['folders'][$folderKey]['latest_uploaded_at'] = $this->newerTimestamp(
            $archivesByYear[$year]['folders'][$folderKey]['latest_uploaded_at'],
            $latestUploadedAt,
        );
    }

    private function transactionDate(ImportTransaction|ExportTransaction $transaction, string $type): Carbon
    {
        return ($type === 'import' ? $transaction->arrival_date : $transaction->export_date) ?? $transaction->created_at;
    }

    private function isComplete(ImportTransaction|ExportTransaction $transaction): bool
    {
        $uploadedTypes = $transaction->documents
            ->pluck('type')
            ->unique()
            ->all();

        return collect($transaction->requiredDocumentTypeKeys())
            ->every(fn (string $stage): bool => in_array($stage, $uploadedTypes, true));
    }

    /**
     * @param  Collection<int, Document>  $documents
     */
    private function latestUploadedAt(Collection $documents): ?string
    {
        /** @var Document|null $latestDocument */
        $latestDocument = $documents->sortByDesc('created_at')->first();

        return $latestDocument?->created_at?->toIso8601String();
    }

    /**
     * @param  Collection<int, Document>  $documents
     */
    private function wasFirstUploadedByUserThisMonth(Collection $documents, User $user): bool
    {
        /** @var Document|null $firstUserDocument */
        $firstUserDocument = $documents
            ->where('uploaded_by', $user->id)
            ->sortBy('created_at')
            ->first();

        if (! $firstUserDocument?->created_at) {
            return false;
        }

        return $firstUserDocument->created_at->isSameMonth(now(), true);
    }

    private function newerTimestamp(?string $current, ?string $candidate): ?string
    {
        if ($candidate === null) {
            return $current;
        }

        if ($current === null) {
            return $candidate;
        }

        return $candidate > $current ? $candidate : $current;
    }
}
