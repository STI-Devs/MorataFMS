<?php

namespace App\Queries\Archives;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Support\Collection;

class ArchiveIndexQuery
{
    public function handle(User $user, bool $mine = false): array
    {
        $userId = $mine ? $user->id : null;

        $imports = ImportTransaction::where('is_archive', true)
            ->with([
                'documents' => fn ($query) => $userId ? $query->where('uploaded_by', $userId) : $query,
                'documents.uploadedBy',
                'importer',
            ])
            ->get()
            ->when($userId, fn (Collection $transactions) => $transactions->filter(fn ($transaction) => $transaction->documents->isNotEmpty()))
            ->map(fn (ImportTransaction $transaction) => [
                'transaction_type' => 'import',
                'year' => $transaction->arrival_date?->year ?? $transaction->created_at->year,
                'month' => $transaction->arrival_date?->month ?? $transaction->created_at->month,
                'bl_no' => $transaction->bl_no,
                'client' => $transaction->importer?->name ?? 'Unknown',
                'documents' => $transaction->documents->map(fn ($document) => [
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
                    'uploaded_at' => $document->created_at?->toIso8601String(),
                    'uploader' => $document->uploadedBy ? [
                        'id' => $document->uploadedBy->id,
                        'name' => $document->uploadedBy->name,
                    ] : null,
                ]),
            ]);

        $exports = ExportTransaction::where('is_archive', true)
            ->with([
                'documents' => fn ($query) => $userId ? $query->where('uploaded_by', $userId) : $query,
                'documents.uploadedBy',
                'shipper',
                'destinationCountry',
            ])
            ->get()
            ->when($userId, fn (Collection $transactions) => $transactions->filter(fn ($transaction) => $transaction->documents->isNotEmpty()))
            ->map(fn (ExportTransaction $transaction) => [
                'transaction_type' => 'export',
                'year' => $transaction->export_date?->year ?? $transaction->created_at->year,
                'month' => $transaction->export_date?->month ?? $transaction->created_at->month,
                'bl_no' => $transaction->bl_no,
                'client' => $transaction->shipper?->name ?? 'Unknown',
                'documents' => $transaction->documents->map(fn ($document) => [
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
                    'uploaded_at' => $document->created_at?->toIso8601String(),
                    'uploader' => $document->uploadedBy ? [
                        'id' => $document->uploadedBy->id,
                        'name' => $document->uploadedBy->name,
                    ] : null,
                ]),
            ]);

        return $imports->merge($exports)
            ->groupBy('year')
            ->sortKeysDesc()
            ->map(fn (Collection $items, $year) => [
                'year' => (int) $year,
                'imports' => $items->where('transaction_type', 'import')->count(),
                'exports' => $items->where('transaction_type', 'export')->count(),
                'documents' => $items->pluck('documents')->flatten(1)->values(),
            ])
            ->values()
            ->all();
    }
}
