<?php

namespace App\Actions\Archives;

use App\Actions\Documents\StoreTransactionDocument;
use App\Enums\ExportStatus;
use App\Models\ExportTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class CreateArchiveExport
{
    public function __construct(private StoreTransactionDocument $storeTransactionDocument) {}

    public function handle(array $validated, User $user): ExportTransaction
    {
        $storedPaths = [];

        try {
            $transaction = DB::transaction(function () use ($validated, $user, &$storedPaths) {
                $transaction = new ExportTransaction;
                $transaction->bl_no = $validated['bl_no'];
                $transaction->vessel = $validated['vessel'] ?? 'N/A';
                $transaction->shipper_id = $validated['shipper_id'];
                $transaction->destination_country_id = $validated['destination_country_id'];
                $transaction->notes = $validated['notes'] ?? null;
                $transaction->export_date = $validated['file_date'];
                $transaction->is_archive = true;
                $transaction->assigned_user_id = $user->id;
                $transaction->status = ExportStatus::Completed;
                $transaction->save();

                foreach ($validated['documents'] ?? [] as $document) {
                    $storedDocument = $this->storeTransactionDocument->handle(
                        $transaction,
                        $document['file'],
                        $document['stage'],
                        $user->id,
                    );

                    $storedPaths[] = $storedDocument->path;
                }

                if (! empty($validated['documents']) && method_exists($transaction, 'recalculateStatus')) {
                    $transaction->recalculateStatus();
                    $transaction->status = ExportStatus::Completed;
                    $transaction->saveQuietly();
                }

                return $transaction;
            });
        } catch (Throwable $exception) {
            foreach ($storedPaths as $path) {
                Storage::disk($this->storageDisk())->delete($path);
            }

            throw $exception;
        }

        $transaction->load(['shipper', 'destinationCountry', 'stages', 'assignedUser']);

        return $transaction;
    }

    private function storageDisk(): string
    {
        return config('filesystems.document_disk', 's3');
    }
}
