<?php

namespace App\Actions\AdminDocumentReview;

use App\Enums\ArchiveOrigin;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use App\Queries\AdminDocumentReview\AdminDocumentReviewTransactionQuery;
use App\Support\AdminDocumentReview\AdminDocumentReviewData;
use App\Support\Documents\DocumentObjectTagger;
use App\Support\Transactions\TransactionSyncBroadcaster;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
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

        $this->ensureArchiveReady($type, $transaction);

        return $this->archiveTransaction($type, $transaction, $user);
    }

    /**
     * @param  list<array{type: string, id: int}>  $transactions
     * @return list<array{
     *     id: int,
     *     type: string,
     *     is_archive: bool,
     *     archived_at: ?string,
     *     archived_by_id: int|null,
     *     archive_origin: string|null
     * }>
     */
    public function handleMany(array $transactions, User $user): array
    {
        $resolvedTransactions = [];

        foreach ($transactions as $transaction) {
            $type = $transaction['type'];

            try {
                $resolvedTransaction = $this->transactionQuery->find($type, (int) $transaction['id']);
            } catch (ModelNotFoundException) {
                throw new HttpException(422, 'One or more transactions are no longer available for review. Refresh the queue and try again.');
            }

            $this->ensureArchiveReady($type, $resolvedTransaction);

            $resolvedTransactions[] = [
                'type' => $type,
                'transaction' => $resolvedTransaction,
            ];
        }

        return DB::transaction(function () use ($resolvedTransactions, $user): array {
            $archivedTransactions = [];

            foreach ($resolvedTransactions as $item) {
                $archivedTransactions[] = $this->archiveTransaction(
                    $item['type'],
                    $item['transaction'],
                    $user,
                );
            }

            return $archivedTransactions;
        });
    }

    private function ensureArchiveReady(string $type, ImportTransaction|ExportTransaction $transaction): void
    {
        $requiredTypes = $this->reviewData->requiredTypeKeysFor($type, $transaction);
        $requiredCompleted = $this->reviewData->countUploadedRequiredTypes($transaction->documents, $requiredTypes);
        $hasUnresolvedRemarks = $this->reviewData->hasUnresolvedRemarks($transaction->remarks);

        if ($requiredCompleted !== count($requiredTypes) || $hasUnresolvedRemarks) {
            throw new HttpException(422, 'This transaction is not ready for archive.');
        }
    }

    private function archiveTransaction(string $type, ImportTransaction|ExportTransaction $transaction, User $user): array
    {
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
