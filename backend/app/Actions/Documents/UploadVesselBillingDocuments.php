<?php

namespace App\Actions\Documents;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use Throwable;

class UploadVesselBillingDocuments
{
    public function __construct(
        private UploadTransactionDocument $uploadTransactionDocument,
        private DeleteTransactionDocument $deleteTransactionDocument,
    ) {}

    /**
     * @param  array<int, UploadedFile>  $files
     * @return array{
     *     vessel_name: string,
     *     affected_transaction_ids: list<int>,
     *     affected_transactions_count: int,
     *     uploaded_documents_count: int
     * }
     */
    public function handle(
        ImportTransaction|ExportTransaction $sourceTransaction,
        array $files,
        User $actor,
    ): array {
        $vesselName = $this->resolveVesselName($sourceTransaction);
        $transactions = $this->resolveTargetTransactions($sourceTransaction, $actor, $vesselName);

        if ($transactions->isEmpty()) {
            throw ValidationException::withMessages([
                'documentable_id' => 'No accounting-ready transactions were found for this vessel.',
            ]);
        }

        $createdDocuments = [];

        try {
            foreach ($transactions as $transaction) {
                foreach ($files as $file) {
                    $createdDocuments[] = $this->uploadTransactionDocument->handle(
                        $transaction,
                        $file,
                        'billing',
                        $actor,
                    );
                }
            }
        } catch (Throwable $exception) {
            foreach (array_reverse($createdDocuments) as $document) {
                try {
                    $this->deleteTransactionDocument->handle($document, $actor);
                } catch (Throwable) {
                }
            }

            throw $exception;
        }

        return [
            'vessel_name' => $vesselName,
            'affected_transaction_ids' => $transactions->modelKeys(),
            'affected_transactions_count' => $transactions->count(),
            'uploaded_documents_count' => count($createdDocuments),
        ];
    }

    private function resolveVesselName(ImportTransaction|ExportTransaction $transaction): string
    {
        return trim($transaction instanceof ImportTransaction
            ? (string) $transaction->vessel_name
            : (string) $transaction->vessel);
    }

    /**
     * @return Collection<int, ImportTransaction|ExportTransaction>
     */
    private function resolveTargetTransactions(
        ImportTransaction|ExportTransaction $sourceTransaction,
        User $actor,
        string $vesselName,
    ): Collection {
        $query = $sourceTransaction::query()
            ->with('stages')
            ->relevantToOperationalQueue($actor)
            ->orderBy('id');

        if ($sourceTransaction instanceof ImportTransaction) {
            $query->where('vessel_name', $vesselName);
        } else {
            $query->where('vessel', $vesselName);
        }

        return $query->get();
    }
}
