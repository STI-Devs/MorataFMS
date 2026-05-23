<?php

namespace App\Actions\Archives;

use App\Actions\Documents\StoreTransactionDocument;
use App\Data\Archives\ArchiveExportData;
use App\Enums\ArchiveOrigin;
use App\Enums\ExportStatus;
use App\Models\ExportTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class CreateArchiveExport
{
    public function __construct(private StoreTransactionDocument $storeTransactionDocument) {}

    public function handle(ArchiveExportData $data, User $user): ExportTransaction
    {
        $storedPaths = [];

        try {
            $transaction = DB::transaction(function () use ($data, $user, &$storedPaths) {
                $transaction = new ExportTransaction;
                $transaction->bl_no = $data->blNo;
                $transaction->vessel = $data->vessel ?? 'N/A';
                $transaction->shipper_id = $data->shipperId;
                $transaction->destination_country_id = $data->destinationCountryId;
                $transaction->notes = $data->notes;
                $transaction->export_date = $data->fileDate;
                $transaction->is_archive = true;
                $transaction->archived_at = now();
                $transaction->archived_by = $user->id;
                $transaction->archive_origin = ArchiveOrigin::DirectArchiveUpload;
                $transaction->assigned_user_id = $user->id;
                $transaction->status = ExportStatus::Completed;
                $transaction->save();

                foreach ($data->notApplicableStages as $stage) {
                    $transaction->setStageApplicability($stage, true, $user->id);
                }

                foreach ($data->documents as $document) {
                    $storedDocument = $this->storeTransactionDocument->handle(
                        $transaction,
                        $document->file,
                        $document->stage,
                        $user->id,
                    );

                    $storedPaths[] = $storedDocument->path;
                }

                if (
                    $data->hasDocumentOrApplicabilityChanges()
                    && method_exists($transaction, 'recalculateStatus')
                ) {
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
        return (string) config('filesystems.default', 'local');
    }
}
