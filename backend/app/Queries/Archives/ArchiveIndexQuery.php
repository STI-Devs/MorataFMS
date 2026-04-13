<?php

namespace App\Queries\Archives;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;

class ArchiveIndexQuery
{
    public function handle(User $user, bool $mine = false): array
    {
        $userId = $mine ? $user->id : null;
        $archivesByYear = [];

        foreach (ImportTransaction::where('is_archive', true)
            ->with([
                'stages',
                'documents' => fn ($query) => $userId ? $query->where('uploaded_by', $userId) : $query,
                'documents.uploadedBy',
                'importer',
            ])
            ->lazyById(100) as $transaction) {
            if ($userId && $transaction->documents->isEmpty()) {
                continue;
            }

            $year = $transaction->arrival_date?->year ?? $transaction->created_at->year;
            $entry = &$archivesByYear[$year];
            $entry ??= [
                'year' => (int) $year,
                'imports' => 0,
                'exports' => 0,
                'documents' => [],
            ];
            $entry['imports']++;

            foreach ($transaction->documents as $document) {
                $entry['documents'][] = [
                    'id' => $document->id,
                    'type' => 'import',
                    'bl_no' => $transaction->bl_no,
                    'month' => $transaction->arrival_date?->month ?? $transaction->created_at->month,
                    'client' => $transaction->importer?->name ?? 'Unknown',
                    'selective_color' => $transaction->selective_color,
                    'transaction_date' => ($transaction->arrival_date ?? $transaction->created_at)->toDateString(),
                    'transaction_id' => $transaction->id,
                    'documentable_type' => ImportTransaction::class,
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
        }

        foreach (ExportTransaction::where('is_archive', true)
            ->with([
                'stages',
                'documents' => fn ($query) => $userId ? $query->where('uploaded_by', $userId) : $query,
                'documents.uploadedBy',
                'shipper',
                'destinationCountry',
            ])
            ->lazyById(100) as $transaction) {
            if ($userId && $transaction->documents->isEmpty()) {
                continue;
            }

            $year = $transaction->export_date?->year ?? $transaction->created_at->year;
            $entry = &$archivesByYear[$year];
            $entry ??= [
                'year' => (int) $year,
                'imports' => 0,
                'exports' => 0,
                'documents' => [],
            ];
            $entry['exports']++;

            foreach ($transaction->documents as $document) {
                $entry['documents'][] = [
                    'id' => $document->id,
                    'type' => 'export',
                    'bl_no' => $transaction->bl_no,
                    'month' => $transaction->export_date?->month ?? $transaction->created_at->month,
                    'client' => $transaction->shipper?->name ?? 'Unknown',
                    'destination_country' => $transaction->destinationCountry?->name,
                    'transaction_date' => ($transaction->export_date ?? $transaction->created_at)->toDateString(),
                    'transaction_id' => $transaction->id,
                    'documentable_type' => ExportTransaction::class,
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
        }

        krsort($archivesByYear);

        return array_values($archivesByYear);
    }
}
