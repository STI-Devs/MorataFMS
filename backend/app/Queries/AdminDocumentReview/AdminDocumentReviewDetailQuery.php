<?php

namespace App\Queries\AdminDocumentReview;

use App\Models\Document;
use App\Support\AdminDocumentReview\AdminDocumentReviewData;

class AdminDocumentReviewDetailQuery
{
    public function __construct(
        private AdminDocumentReviewTransactionQuery $transactionQuery,
        private AdminDocumentReviewData $reviewData,
    ) {}

    public function handle(string $type, int $id): array
    {
        $transaction = $this->transactionQuery->find($type, $id);
        $requiredTypes = $this->reviewData->requiredTypeKeysFor($type, $transaction);
        $displayStageTypes = $this->reviewData->displayTypeKeysFor($type);
        $notApplicableStages = $transaction->notApplicableStageKeys();
        $labels = Document::getTypeLabels();
        $documents = $transaction->documents;
        $requiredCompleted = $this->reviewData->countUploadedRequiredTypes($documents, $requiredTypes);
        $flaggedCount = $transaction->remarks->filter(fn ($remark) => ! $remark->is_resolved)->count();
        $requiredTotal = count($requiredTypes);

        return [
            'transaction' => $this->reviewData->mapDetailTransaction($transaction, $type),
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
                            'uploaded_at' => $this->reviewData->formatDateTime($file->created_at),
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
                        'uploaded_at' => $this->reviewData->formatDateTime($document->created_at),
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
                    'created_at' => $this->reviewData->formatDateTime($remark->created_at),
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
                'readiness' => $this->reviewData->readinessFor($requiredCompleted === $requiredTotal, $flaggedCount > 0),
            ],
        ];
    }
}
