<?php

namespace App\Queries\Transactions;

use App\Enums\ImportStatus;
use App\Http\Resources\ExportTransactionResource;
use App\Http\Resources\ImportTransactionResource;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class TrackingTransactionQuery
{
    /**
     * @return array{data: array{type: string, transaction: array<string, mixed>}}
     */
    public function handle(Request $request, string $referenceId): array
    {
        $importTransaction = ImportTransaction::query()
            ->visibleTo($request->user())
            ->with(['importer', 'originCountry', 'locationOfGoods', 'stages', 'assignedUser'])
            ->withCount(['remarks as open_remarks_count' => fn ($query) => $query->where('is_resolved', false)])
            ->withCount('documents')
            ->where('customs_ref_no', $referenceId)
            ->whereNotIn('status', [
                ImportStatus::Completed->value,
                ImportStatus::Cancelled->value,
            ])
            ->latest('id')
            ->first();

        if ($importTransaction) {
            return [
                'data' => [
                    'type' => 'import',
                    'transaction' => (new ImportTransactionResource($importTransaction))->resolve($request),
                ],
            ];
        }

        $exportQuery = ExportTransaction::query()
            ->visibleTo($request->user())
            ->with(['shipper', 'stages', 'assignedUser', 'destinationCountry'])
            ->withCount(['remarks as open_remarks_count' => fn ($query) => $query->where('is_resolved', false)])
            ->withCount('documents');

        $exportId = $this->parseExportReference($referenceId);

        $exportTransaction = $exportId !== null
            ? (clone $exportQuery)->find($exportId)
            : null;

        if (! $exportTransaction) {
            $exportTransaction = (clone $exportQuery)
                ->where('bl_no', trim($referenceId))
                ->latest('id')
                ->first();
        }

        if (! $exportTransaction || $exportTransaction->status->isTerminal()) {
            throw new NotFoundHttpException;
        }

        return [
            'data' => [
                'type' => 'export',
                'transaction' => (new ExportTransactionResource($exportTransaction))->resolve($request),
            ],
        ];
    }

    private function parseExportReference(string $referenceId): ?int
    {
        if (preg_match('/^(?:EXP-)?(\d+)$/i', trim($referenceId), $matches) !== 1) {
            return null;
        }

        return (int) $matches[1];
    }
}
