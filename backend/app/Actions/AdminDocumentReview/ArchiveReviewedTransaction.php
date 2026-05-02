<?php

namespace App\Actions\AdminDocumentReview;

use App\Enums\ArchiveOrigin;
use App\Models\User;
use App\Queries\AdminDocumentReview\AdminDocumentReviewTransactionQuery;
use App\Support\AdminDocumentReview\AdminDocumentReviewData;
use App\Support\Documents\DocumentObjectTagger;
use App\Support\Transactions\TransactionSyncBroadcaster;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ArchiveReviewedTransaction
{
    public function __construct(
        private AdminDocumentReviewTransactionQuery $transactionQuery,
        private AdminDocumentReviewData $reviewData,
        private DocumentObjectTagger $documentObjectTagger,
        private TransactionSyncBroadcaster $transactionSyncBroadcaster,
    ) {}

    /**
     * @return array{
     *     id: int,
     *     type: string,
     *     is_archive: bool,
     *     archived_at: ?string,
     *     archived_by_id: int|null,
     *     archive_origin: string|null
     * }
     */
    public function handle(string $type, int $id, User $user): array
    {
        $transaction = $this->transactionQuery->find($type, $id);
        $requiredTypes = $this->reviewData->requiredTypeKeysFor($type, $transaction);
        $requiredCompleted = $this->reviewData->countUploadedRequiredTypes($transaction->documents, $requiredTypes);
        $hasUnresolvedRemarks = $this->reviewData->hasUnresolvedRemarks($transaction->remarks);

        if ($requiredCompleted !== count($requiredTypes) || $hasUnresolvedRemarks) {
            throw new HttpException(422, 'This transaction is not ready for archive.');
        }

        $transaction->forceFill([
            'is_archive' => true,
            'archived_at' => now(),
            'archived_by' => $user->id,
            'archive_origin' => ArchiveOrigin::ArchivedFromLive,
        ])->save();
        $transaction->load('documents');

        $this->documentObjectTagger->syncTransactionDocuments($transaction);
        $this->transactionSyncBroadcaster->transactionChanged($transaction, $user, 'archived');

        return [
            'id' => $transaction->id,
            'type' => $type,
            'is_archive' => true,
            'archived_at' => $this->reviewData->formatDateTime($transaction->archived_at),
            'archived_by_id' => $transaction->archived_by,
            'archive_origin' => $transaction->archive_origin?->value,
        ];
    }
}
